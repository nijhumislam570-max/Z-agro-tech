
The Academy page works but has UX gaps and a console warning. Two console warnings stem from `Skeleton` and `CourseCard` not forwarding refs (Radix tooltip etc. wraps them). Page-level UX issues at mobile (390px):
- Hero is short of trust signals (course count, language, learner count).
- Single "All / category" chip row with no count badges.
- No search input — with 10+ courses users need filtering.
- Skeleton count fixed at 6, doesn't match grid columns.
- No price-free-vs-paid distinction beyond text.
- Course card lacks visual hierarchy on small screens (no rating/learner proof).

**Plan:**
1. Fix `forwardRef` on `Skeleton`, `CourseCard`, and `CourseSkeleton` to silence warnings.
2. Add a search input (filters by title/description/audience client-side).
3. Add count badges to category chips.
4. Add a results-count line above the grid.
5. Polish hero with stat strip (courses count, language, certificate).
6. Match skeleton count to grid breakpoints (show 6 on mobile, fine).
7. Test the requested end-to-end flows on the live preview after edits.

Skipping major redesign — the layout is fine. Just polish + warnings + search.
