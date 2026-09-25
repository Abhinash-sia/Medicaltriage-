# MedicalTriage — Production Deployment Engineering Considerations

> **Production Hardening Guidelines**
> *Note: This document outlines technical requirements, infrastructure hardening, and governance prerequisites for transitioning the MedicalTriage prototype into a production-ready healthcare environment.*

---

## ⚠️ PROTOTYPE NOTICE

```text
The repository currently contains a prototype/hackathon implementation.
The deployment architecture below represents recommended engineering requirements for
a future production environment, NOT an active deployment guide for the current prototype.
```

---

## 1. Network, TLS & Ingress Hardening

- **HTTPS / TLS 1.3 Termination**: All HTTP traffic must be encrypted using TLS 1.3 with HSTS enabled (`Strict-Transport-Security`).
- **Web Application Firewall (WAF)**: Deploy AWS WAF, Cloudflare Magic Transit, or GCP Cloud Armor to mitigate DDoS, SQL/NoSQL injection, and common web application exploits.
- **CORS Restricted Origins**: Restrict CORS `allowedOrigins` strictly to verified production domain names rather than wildcard localhost endpoints.

---

## 2. Database Hardening (MongoDB)

- **MongoDB Enterprise Cluster**: Deploy a minimum 3-node MongoDB Replica Set or Managed Atlas Cluster.
- **Encryption at Rest**: Enable WiredTiger storage engine encryption using customer-managed keys (AWS KMS / GCP Cloud KMS).
- **VPC & Private Link**: Isolate database instances inside a private Virtual Private Cloud (VPC) accessible only via MongoDB PrivateLink or IP whitelisting from backend app nodes.
- **Automated Backup & Point-in-Time Recovery**: Configure continuous automated backups with 30-day point-in-time recovery (PITR).

---

## 3. Distributed Async Architecture & Storage

- **Object Storage Migration**: Replace local filesystem storage (`./uploads`) with S3 or GCS bucket storage.
  - Enable bucket encryption (`SSE-KMS`).
  - Access files exclusively via pre-signed temporary URLs (short expiration ≤ 15 minutes).
- **Redis & Distributed Message Queue**: Migrate background SLA monitoring, retention purges, and media processing to Redis + BullMQ workers.
- **Distributed Rate-Limiter**: Configure `express-rate-limit` with `rate-limit-redis` for cluster-wide rate limiting across multiple app instances.

---

## 4. Key Management & Secrets

- **Secret Manager**: Store `GEMINI_API_KEY`, `SARVAM_API_KEY`, and `JWT_SECRET` in HashiCorp Vault, AWS Secrets Manager, or GCP Secret Manager.
- **Key Rotation**: Implement automated 90-day rotation for API keys and JWT signing secrets.

---

## 5. Clinical, Privacy & Regulatory Compliance Prerequisites

Before deploying MedicalTriage in a real-world clinic, hospital, or PHC setting, the deployment must undergo:

1. **Clinical Validation Review**: Formal evaluation by qualified clinical advisory boards and medical ethics committees.
2. **Jurisdictional Regulatory Certification**: Certification under relevant healthcare data standards (e.g., Ayushman Bharat Digital Mission (ABDM) standards in India, DISHA compliance, or local health authority guidelines).
3. **Third-Party Security Audit**: Independent penetration testing, vulnerability assessment, and static/dynamic code security audit.
4. **Legal Consent & Privacy Signoff**: Review of patient consent terms, data protection impact assessments (DPIA), and institutional data sharing agreements.
