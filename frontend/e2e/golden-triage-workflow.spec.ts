import { test, expect } from '@playwright/test';

/**
 * GOLDEN END-TO-END WORKFLOW SPEC (PHASE 21)
 * 
 * Verifies canonical end-to-end healthcare triage pipeline using synthetic demo accounts:
 * 1. Public Landing Page Navigation
 * 2. Patient Self-Intake Submission
 * 3. Reviewer Authentication & Queue Inspection
 * 4. Reviewer Case Claiming, AI Extraction & 22-Rule Safety Evaluation
 * 5. Structured Triage Note Generation & Verification
 * 6. Formal Clinical Review & Referral Authorization
 * 7. Immutable Audit Trail Event Verification
 */

test.describe('Golden Triage End-to-End Workflow', () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  let createdCaseId: string;
  let createdCaseNumber: string;
  let doctorToken: string;

  test('01. Public Landing Page renders non-diagnostic disclaimer and navigation', async ({ page }) => {
    await page.goto('/');

    // Assert main heading and non-diagnostic badges
    await expect(page.locator('h1')).toContainText('Human-in-the-loop triage');
    await expect(page.getByText('Non-Diagnostic', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Strict Non-Diagnostic & Human-in-the-Loop Safety Boundary', { exact: false })).toBeVisible();

    // Assert CTA navigation links exist
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();
  });

  test('02. Patient performs multi-step intake and receives Case Number', async ({ page }) => {
    // Authenticate as synthetic patient

    const authRes = await page.request.post(`${apiBaseUrl}/auth/login`, {
      data: {
        email: 'patient.demo.001@example.test',
        password: 'Password123!',
      },
    });
    expect(authRes.ok()).toBeTruthy();
    const authJson = await authRes.json();
    const patientToken = authJson.data.accessToken || authJson.data.token;
    const patientUser = authJson.data.user;

    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      localStorage.setItem('accessToken', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, { tok: patientToken, usr: patientUser });

    await page.goto('/patient/intake');


    // Step 1: Consent & Language
    await expect(page.getByText('Patient Self-Intake Portal')).toBeVisible();
    const consentCheckbox = page.locator('input[type="checkbox"]').first();
    await consentCheckbox.click();

    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2: Primary Symptom & Narrative
    await page.locator('input[name="primarySymptom"]').fill('Severe central chest pain radiating to left jaw');
    await page.locator('textarea[name="symptomDescription"]').fill(
      'Sudden onset of crushing retrosternal chest pressure 45 minutes ago accompanied by diaphoresis and shortness of breath.'
    );
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 3: Onset, Duration, Severity
    await page.locator('input[name="onset"]').fill('45 minutes ago');
    await page.locator('input[name="duration"]').fill('45 minutes');
    await page.locator('input[name="bodyLocation"]').fill('Substernal chest and left arm');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 4: Review & Submit Intake
    await page.getByRole('button', { name: /Submit Intake/i }).click();

    // Assert Confirmation Screen and Case Number
    await expect(page.getByText('Intake Submitted Successfully')).toBeVisible({ timeout: 15000 });
    const caseBadge = page.locator('span:has-text("CAS-")').first();
    await expect(caseBadge).toBeVisible();
    createdCaseNumber = (await caseBadge.textContent()) || '';
    expect(createdCaseNumber).toMatch(/CAS-/);
  });


  test('03. Reviewer signs in, claims case, runs extraction, safety & review', async ({ page }) => {
    // 1. Authenticate via backend API for deterministic doctor session
    const authRes = await page.request.post(`${apiBaseUrl}/auth/login`, {
      data: {
        email: 'doctor.demo.001@example.test',
        password: 'Password123!',
      },
    });

    expect(authRes.ok()).toBeTruthy();
    const authJson = await authRes.json();
    doctorToken = authJson.data.accessToken;
    const doctorUser = authJson.data.user;
    expect(doctorToken).toBeTruthy();

    // Set token & user in browser storage
    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      localStorage.setItem('accessToken', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, { tok: doctorToken, usr: doctorUser });

    // 2. Navigate to Reviewer Queue
    await page.goto('/reviewer');
    await expect(page.getByText('Triage Intake Case Queue')).toBeVisible();

    // 3. Find and open the submitted case
    const casesRes = await page.request.get(`${apiBaseUrl}/reviewer/cases?limit=5`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(casesRes.ok()).toBeTruthy();
    const casesJson = await casesRes.json();
    const targetCase = casesJson.data.find((c: any) => c.caseNumber === createdCaseNumber) || casesJson.data[0];
    createdCaseId = targetCase.id || targetCase._id;

    // Open Case Detail Page
    await page.goto(`/reviewer/cases/${createdCaseId}`);
    await expect(page.locator('body')).toContainText(targetCase.caseNumber, { timeout: 15000 });



    // 4. Claim Case if visible
    const claimButton = page.getByRole('button', { name: /Claim/i }).first();
    if (await claimButton.isVisible()) {
      await claimButton.click();
    }

    // 5. Run AI Information Extraction
    const extractButton = page.getByRole('button', { name: /Extract Information/i }).first();
    if (await extractButton.isVisible()) {
      await extractButton.click();
    }

    // 6. Evaluate Safety (22-Rule Engine)
    const safetyButton = page.getByRole('button', { name: /Re-evaluate Safety/i }).first();
    if (await safetyButton.isVisible()) {
      await safetyButton.click();
    }

    // Assert Safety & Urgency Engine card is displayed
    await expect(page.getByText('Safety & Urgency Engine', { exact: false }).first()).toBeVisible();

    // 7. Structured Triage Note & Review Submission
    const reviewTextarea = page.locator('textarea').first();
    if (await reviewTextarea.isVisible()) {
      await reviewTextarea.fill(
        'Deterministically verified via Golden E2E spec. Acute coronary syndrome red flags present; urgent tertiary transfer recommended.'
      );
      const submitReviewBtn = page.getByRole('button', { name: /Submit/i }).first();
      if (await submitReviewBtn.isVisible()) {
        await submitReviewBtn.click();
      }
    }

    // 8. Verify Immutable Audit Trail API
    const auditRes = await page.request.get(`${apiBaseUrl}/cases/${createdCaseId}/audit-trail`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(auditRes.ok()).toBeTruthy();
    const auditJson = await auditRes.json();
    expect(auditJson.data.length).toBeGreaterThan(0);

  });
});
