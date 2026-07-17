# Metaphor Interior Architecture – Digital Product & Service Offering (Detailed PRD + Image/Visual Placement)

---

### TL;DR

Metaphor Interior Architecture is an award-winning Jakarta-based interior design consultant with a global reach, specializing in immersive projects for hospitality, restaurants & bars, office, retail, public space, and residential marketing suites. This PRD describes a sophisticated digital experience: a portfolio-driven website and client project portal, emphasizing high-visual impact, immersive design visualization, and seamless client collaboration. Graphic/visual placement and layout cues are included for designers/devs as comments/markdown for optimal alignment with the brand and sector standards.

---

## Goals

### Business Goals

* Achieve a 20% YoY increase in international and regional project acquisition
* Reduce lead-to-engagement cycle to under 14 days by digitizing client onboarding and approvals
* Elevate brand as a digital-first, design-led, and award-winning interior architecture firm in APAC media
* Position Metaphor as a top-3 destination for F&B/hospitality/retail project inquiries in Indonesia and Southeast Asia

### User Goals

* Clients (B2B) can search and review projects, engage, and approve deliverables fully online
* Developers/property owners understand Metaphor's process and past performance via interactive case studies
* Stakeholders get transparency on project progress, documents, and visualization at every step
* Clients can preview 3D/VR walkthroughs and annotate changes collaboratively
* Prospective clients are inspired to submit high-value RFP/inquiries through an intuitive contact funnel

### Non-Goals

* No B2C/retail or DIY design tools
* No online purchasing of physical furniture or decor
* Excludes public freelance/marketplace/open-bid services

---

## User Stories

**Personas:**

* Hotel Owner/Chain
* F&B Group Director
* Commercial/Retail Developer
* Interior Design Reviewer (media/awards/jury)
* Facilities/PMO Lead (for office fit-outs)

Example Stories:

* As a Hotel Owner, I want to experience past projects through interactive galleries and VR, so I can build trust before committing.
* As an F&B Group Director, I want to fast-track concept feedback by using digital annotation on 3D designs, so that my brand launches on time.
* As a Commercial Developer, I want to monitor every project milestone and access all documents/deliverables in a secure dashboard.
* As a Reviewer, I want a curated feed of Metaphor’s most innovative, published, and awarded projects for easy assessment.
* As a Facilities Lead, I want to easily download technical drawings/specs for seamless contractor handover.

---

## Functional Requirements

**1. Portfolio & Visual Gallery (HIGH)**

* Dynamic homepage banner (Full-bleed hero image/video of flagship projects)
* Filterable project grid (sector/tag/client/award year)
* Project detail page structure: \[Large Project Title\] \[Featured Project Image\] \[Key Facts Box\] \[Project Narrative / Gallery Carousel\] \[Award & Media Logos/Links\]
* VR/360 & 3D viewer integration for select projects *(placement: prominent in gallery; float or modal overlay)*
* Downloadable hi-res media options for press/awards

**2. Client Portal: Project Dashboard (HIGH)**

* Client login/register (button top-right; modal/pop-up)
* Dashboard landing page: \[Project selector dropdown\] \[Timeline/progress bar widget\] \[Current phase summary\]
* Deliverable/document list with versioning; click-through for annotated PDFs/3D reviews
* Approval, feedback, and comment threads per milestone/deliverable
* Push/email notification integration for deadlines & feedback

**3. 3D Visualization & Review Tools (HIGH)**

* Embedded high-res 3D renders and real-time walkthroughs *(viewport: large, center-aligned, landscape and mobile adaptive)*
* Annotation pins, comments side panel, compare toggle (version A/B)
* Integration/export for remote presentation (Zoom, Teams); compatible file uploads/downloads

**4. Insights & Trends Content Hub (MEDIUM)**

* Article/blog aggregator curated by category (project news, trend analysis, awards)
* Visual tiles for articles (image + short excerpt/CTA)
* Featured stories widget on homepage *(placement: beneath portfolio grid or as a mid-page interruption)*

**5. RFP/Contact Conversion Funnel (HIGH)**

* One-click CTA banner/header (“Start Your Project”)
* Dynamic RFP intake: \[Sector\] \[Project Scope/brief/Budget/Timeline picker\], attaches images/reference files
* Auto-confirmation and invite to book consultation *(post-submit modal with calendar widget)*

**6. Admin & Content Management (MEDIUM)**

* Multi-role secure access (admin, project manager, client)
* Case study/project CRUD with image ordering, tag/sector/award mapping, featured toggles

---

## User Experience: End-to-End Journey, Layout & Visual Cues

### Entry Experience

* **Visual:** \[Full-screen project hero video loop or flagship image\]
* Short headline, animated tagline, and CTA overlay
* Navigation: sticky top bar w/ logo left, links (Portfolio, Services, Insights, Contact) right
* Feature strip: \[Recent award logos/media mentions, arranged horizontally below hero image\]

### Portfolio/Project Discovery

* **Grid layout:** masonry/responsive, image-forward thumbnails
* Hover effect: image lifts, overlay with project title & brief
* **Filter/tool bar:** left-aligned; sector, year, award toggle
* On click: launches \[Project Detail\]

### Project Detail Page

* **Structure example:**
  1. \[Large landscape image or video header\]
  2. \[Project title, location, sector, year – right below image\]
  3. Key Metrics Box (Size, Budget, Status)
  4. \[360 VR viewer/3D carousel in-place or floating sidebar\]
  5. Gallery: scrollable or modal image slider
  6. Narrative/description section with visual call-outs (e.g., design concept diagram, floorplan thumbnail inline)
  7. Awards/Media section (small logos, press links)

### Client Portal/Project Dashboard

* **Visual:** Clean, white or light background, color accents in Metaphor’s brand palette
* Sidebar navigation (Projects, Documents, Feedback, Calendar)
* Content pane: milestones as graphical progress bar, document list with download/preview icons
* Feedback capture: inline comment threads, annotation overlay for visual deliverables, colored status tags (e.g., “Pending Client”, “Revision Requested”)

### 3D/VR Review Workflow

* **Placement:** Main content pane, expand-to-fullscreen option
* Controls: navigation arrows, mouse/touch drag, “add comment” pin. Side-by-side compare enabled for iterations.
* Mobile: Touch-centric layout; swipe to navigate renderings/photos

### Content & Insight Hub

* **Tiles:** Article image, overlaid headline/excerpt
* Pagination or infinite scroll, with “Back to Insights” always visible
* **Placement:** Prominent on homepage (below main portfolio/slider) & own top nav section

### RFP & Consultation

* **Form modal:** Large input fields, drag-and-drop for files/images, progress bar at top
* Success: Visual confirmation (checkmark or animated graphic), “Book Consultation” link with embedded calendar
* Placement: Persistent CTA button (homepage hero and nav bar); footer short form

---

## Narrative

*Example User Scenario:* A regional F&B group visits the Metaphor site after reading about the latest design awards. They’re welcomed by a cinematic project hero video and a curated carousel of relevant restaurant/bar interiors. Clicking through, they see 3D and VR walk-through options and download a project deck. The group’s director submits an RFP via the one-click form and books a call, then invites their interior committee to preview/contribute feedback using annotation pins on the 3D renders. Shared milestone dashboards and visual revision threads make the process transparent and rapid, resulting in stunning, buzzworthy new spaces that win both guest approval and industry accolades.

---

## Success Metrics

### User-Centric

* Client satisfaction surveys (NPS >80)
* % of projects approved on first/second iteration
* RFP form conversion and drop-off analytics
* Project dashboard DAU/MAU

### Business

* Inbound qualified client leads (target +30% QoQ)
* Award/media coverage mentions
* Average project engagement-to-close duration

### Technical

* Media load speed (<2.5s for all major visuals)
* System uptime (99.9%)
* VR/3D feature adoption rates (tracked unique launches/sessions)

### Tracking Plan

* Homepage and portfolio view events
* 3D/VR engagement actions
* Client login and document download metrics
* Feedback event timestamps, annotation counts

---

## Technical Considerations

### Needs

* Cloud-based web application w/ robust CMS
* Secure object storage (AWS S3, GCP, Azure) for large graphics, 3D CAD, and video assets
* CDN (Cloudflare, Akamai) for image/video deliverability globally
* VR/3D rendering library compatible with web (three.js, Babylon.js or similar)
* Multi-user role/project permissioning logic

### Integrations

* Google Calendar/Outlook for meeting bookings
* Zoom/Teams for remote design sessions
* Analytics: Google Analytics, Hotjar, Firebase
* Social: IG/Pinterest embeds; media share modules

### Data & Privacy

* Region-compliant storage and protocols (GDPR; Indonesian PDPA)
* Access control and encrypted data flows; time-limited download URLs

### Performance

* Load balanced, scalable cloud infra
* Automated image/video resizing, adaptive quality
* Redundant backups and disaster recovery

---

## Milestones & Sequencing

### Project Estimate

* MVP: 4–5 weeks; polished V1 with all core modules: 8–12 weeks

### Team

* Lean: 3–4 (PM/Product, Designer/UX, Full Stack Dev, optional 3D/VR Contractor)

### Phases

1. **Discovery & Wireframes (1 week):** Asset gathering, layout plans, initial project tagging
2. **Design & Build – Portfolio & Public (2 weeks):** Front-facing pages, CMS, dynamic galleries, SEO setup
3. **Client Portal & 3D/VR Functionality (2–4 weeks):** Dashboard logic, visualization integrations, feedback/approval workflows
4. **Testing/Refinement (1–2 weeks):** UX polish, multi-device QA, go-live planning **Dependencies:** Timely asset handoff (images, CAD files, project write-ups); 3D content pipeline

---

## Notes for Designers/Developers

* Always prioritize immersive, cinematic image placements, using large hero banners, grid layouts, and interactive visual elements
* All images must have alt text for accessibility; use aspect ratio consistent with real project imagery (landscape 16:9 preferred for main banners)
* CTA buttons (Primary: dark/brand color, high-contrast) must be visually distinct and persistent where relevant
* Layouts must be responsive—show image stacks on mobile, grids on desktop
* Minimize text overlays on images; keep legibility and visual focus on design content

---

*For more inspiration, continually reference *[*https://the-metaphor.com/*](https://the-metaphor.com/)* for up-to-date visual and functional trends, emphasizing high-value project imagery and an editorial feel throughout the digital product.*