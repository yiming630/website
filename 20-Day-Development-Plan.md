# 20-Day Development Plan (3-Person Team)

**Scope Adjustments**
• Comment/annotation features **removed**  
• Redis caching **removed** – using PostgreSQL only

---
## Team Roles
Role | Focus | Key Skills
---- | ----- | ----------
Frontend Dev | UI / UX, Next.js 15 | React 19, TailwindCSS, TipTap, TypeScript
Backend Dev | GraphQL API, Baidu Cloud, Python pipeline | Node.js, PostgreSQL, Baidu AI, Docker
Full-Stack Dev | Integration, real-time collab, DevOps | WebSocket, CI/CD, Monitoring

---
## Weekly Roadmap
Week | Goal | Highlights
---- | ---- | ----------
1 | **Foundation** | • Project skeleton & Docker Compose  
  • PostgreSQL schema & migrations  
  • GraphQL Gateway (users, projects, documents)  
  • BOS file upload/download helpers  
  • Auth via Baidu IAM → JWT
2 | **Processing & Translation** | • Integrate Python PDF→DOCX worker  
  • Baidu AI translation service  
  • Simple DB-based job queue + WebSocket progress  
  • File-upload UI & translation settings pages
3 | **Collaboration & Editor** | • TipTap editor polish (formatting, side-by-side)  
  • Real-time collaboration (cursor, presence, OT)  
  • Dashboard analytics  
  • Export endpoints (DOCX/PDF/TXT)
4 | **Production & Launch** | • Security hardening & rate-limiting  
  • Monitoring / alerts (Prometheus)  
  • CI/CD to production, CDN for assets  
  • Bundle optimisation & cross-browser QA

---
## Key Deliverables
1. Upload → AI translate → Collaborative edit → Export flow.  
2. GraphQL API (users, projects, documents, jobs).  
3. PostgreSQL schema (no Redis).  
4. Real-time collaboration without comments.  
5. Automated build, test & deploy pipeline.

---
## Risks & Mitigation
Risk | Mitigation
---- | ----------
Baidu API latency / quota | Early load testing; queue & retry.
Large files slow translation | Chunked processing + streaming updates.
Merge conflicts in live editing | Operational-Transform algorithm & user limits.

---
**Success Metric:** A 20-page PDF is translated, collaboratively refined and exported within the platform before Day 20.
