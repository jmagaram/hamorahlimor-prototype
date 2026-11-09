# Decisions

Why things are the way they are. Newest first. Each entry: the decision, why, and what we gave up.

## Class is free text on Student, not an entity (2026-11-09)

**Decision.** Removed the Class entity and the Classes pages. `Student.className` is optional free text. The class picker offers the classes already in use, "No class", and a new name. Students are listed grouped by class A–Z (then "No class"), names A–Z within each group.

**Why.** Classes only exist to group students, for the Students list and for assigning work to a whole class (ticking a class heading on Assign). A separate entity brought its own pages, add/delete flows, uniqueness rules, and the "no classes yet" problem, all for a name.

**Gave up.** A class can't exist empty (it appears when its first student gets it). Renaming means changing every student in it (select the group, `Change class`). If classes ever need their own data (year, schedule, archiving), the entity has to come back.

## Navigation: crumbs + labeled Back, page heading in the body (2026-11-09)

**Decision.** No header on Home. Elsewhere the header shows small crumbs for everything above the parent, then a Back button labeled with the parent (`‹ Aleph`). The current page is named by an `<h2>` at the top of the body, and each page picks its own heading text (`Edit question 2`, `Assign to Itai Cohen`).

**Why.** The old header had a Home button, a Back button, and a full breadcrumb that included the current page. Because the breadcrumb is the navigation stack, Home duplicated the first crumb and Back duplicated the parent crumb: three ways to reach the same places. The 360px header also squeezed long titles. Moving the current title into the body gives it room to wrap and lets it describe the task, not just the place. Back stays as a real button because it's the most-used control and crumb links are small tap targets.

**Gave up.** The heading scrolls away on long pages (accepted for now). The parent's name appears only on the Back button, not as a crumb.

## Docs hold guidelines and decisions, not page specs (2026-11-09)

**Decision.** Deleted `docs/screens.md`. The code in `src/pages/` is the spec for each page.

**Why.** Every UI tweak had to be made twice, in code and in the per-page doc, which slowed down prototyping. Only prototype-wide rules (CLAUDE.md), the data model, and decision reasoning (this file) are worth keeping in docs.
