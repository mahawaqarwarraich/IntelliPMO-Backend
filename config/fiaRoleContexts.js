/**
 * Role-scoped platform documentation for FIA (FMS / FYP Management System).
 * Used server-side only — each role receives only its own block.
 * Paths match the app dashboard routes where applicable.
 */

export const FIA_ROLE_CONTEXT = {
  Admin: `
ROLE: Admin (full FMS administration)

WHAT FMS IS:
FMS (FYP Management System) helps your institution run Final Year Projects in one active
FYP session at a time: configure rules, register people, manage group formation and approvals,
Defense 1 (D1) panels and marks, deadlines, submissions, policies, and communications.

ACTIVE SESSION:
- Only one session should be "active" at a time. Other sessions are draft or inactive.
- Admins create and update sessions under Manage FYP sessions (path: http://localhost:3000/dashboard/manage-sessions).
- Session fields typically include academic year, CGPA and membership limits, group limits,
  number of evaluations, and Defense 1 / Defense 2 weightages.
- Admins can change a session's status (draft / active / inactive) from the same area
  ("Change session status"). Activating a session when another is already active may be blocked.

PEOPLE & STRUCTURE:
- Manage domains (http://localhost:3000/dashboard/manage-domains): academic/project domains.
- Manage Supervisors (http://localhost:3000/dashboard/manage-supervisors): supervisor accounts tied to domains/sessions.
- Manage evaluators (http://localhost:3000/dashboard/manage-evaluators): evaluator accounts.
- Manage students (http://localhost:3000/dashboard/manage-students): student accounts and session assignment.

VISIBILITY & REPORTING:
- Domains and supervisors (http://localhost:3000/dashboard/domains-supervisors): overview of domains and supervisors.
- Supervisor Allocation Status (http://localhost:3000/dashboard/supervisor-allocation): how supervisors are used vs capacity.
- All registered domains (http://localhost:3000/dashboard/all-domains): list of domains for the active context.
- All registered groups (http://localhost:3000/dashboard/all-groups): fully approved groups (overall status approved).

GROUP WORKFLOW (ADMIN SIDE):
- Students form groups and pick a supervisor (subject to session rules).
- Supervisors first respond to group requests; admins use Group Requests
  (http://localhost:3000/dashboard/admin/group-requests) to accept or reject after supervisor alignment with policy.
- Approvals can include messages visible to students on Request Status.

DEFENSE 1 (D1):
- Create panels for D1 (http://localhost:3000/dashboard/create-panels-d1): define D1 panels and members.
- Panel assignment D1 (http://localhost:3000/dashboard/panel-assignment-d1): assign groups to panels (e.g. unassigned groups).
- Panels for D1 (http://localhost:3000/dashboard/panels-d1): view panels, members, and assigned groups.
- Give D1 marks — admin path (http://localhost:3000/dashboard/give-d1-marks): enter or view D1 marks per group/student.

DEADLINES & SUBMISSIONS:
- Create deadline Create deadline (http://localhost:3000/dashboard/create-deadline).
- All deadlines (http://localhost:3000/dashboard/all-deadlines): view all deadlines.
- All submissions (http://localhost:3000/dashboard/all-submissions): submission overview for admins.

POLICY & COMMUNICATIONS:
- Session policy (http://localhost:3000/dashboard/session-policy): institutional rules text for the session.
- FYP resources (http://localhost:3000/dashboard/fyp-resources): documents/links for students and staff.
- FYP Events (http://localhost:3000/dashboard/fyp-events): calendar-style FYP events.

HELP ASSISTANT:
- Chat with FIA (http://localhost:3000/dashboard/fia): AI assistant for how to use FMS (this product).

COMMON ADMIN QUESTIONS:
- "How do I start a new cohort?" → Create/update session, set status active, register students/supervisors, publish policy and deadlines.
- "Why can't I activate two sessions?" → Platform enforces one active session for consistency.
- "Where do I approve groups?" → Group Requests (admin). Ensure supervisor step is aligned first when required.
- "Where are D1 panels?" → Create panels, then panel assignment, then view Panels for D1; marks via Give D1 marks.
`,

  Student: `
ROLE: Student (FYP participant)

WHAT FMS IS FOR YOU:
FMS helps you register as part of an FYP session, form a project group, see approval status,
meet deadlines, join group chat, see sessions policy and resources, and follow Defense 1 info
when your session is active.

YOUR SESSION MUST MATCH THE ACTIVE SESSION:
- Many features only work when your account's session is the same as the institution's
  active session. If not, pages may show that your session is not active.

NAVIGATION (YOUR MENU):
- Chat rooms (http://localhost:3000/dashboard/chat-rooms): message your group after you are in an approved group;
  open the room for your group from the list.
- All domains (http://localhost:3000/dashboard/all-domains): browse available project domains.
- Domains and supervisors (http://localhost:3000/dashboard/domains-supervisors): see supervisors linked to domains.
- Session policy (http://localhost:3000/dashboard/session-policy): rules for your FYP session.
- FYP resources (http://localhost:3000/dashboard/fyp-resources): documents and links.
- FYP Events (http://localhost:3000/dashboard/fyp-events): official FYP events.
- Register Group (http://localhost:3000/dashboard/register-group): propose a group (idea, description, supervisor choice, members).
  You must meet session rules (e.g. min/max members, CGPA). You can only be in one group at a time.
- Request Status (http://localhost:3000/dashboard/request-status): see supervisor and admin approval status and any messages.
  If a request is rejected, you may be able to delete the group and register again (per platform rules).
- Complete FYP guide/lifecycle (http://localhost:3000/dashboard/fyp-guide): step-by-step FYP lifecycle guidance.
- All meetings (http://localhost:3000/dashboard/all-meetings): meetings relevant to you.
- Supervisor Allocation Status (http://localhost:3000/dashboard/supervisor-allocation): public-style view of supervision load.
- Panels for D1 (http://localhost:3000/dashboard/panels-d1): view D1 panel information when available for your session.
- All registered groups (http://localhost:3000/dashboard/all-groups): list of fully approved groups (active session).
- All deadlines (http://localhost:3000/dashboard/all-deadlines): due dates you must follow.
- Chat with FIA (http://localhost:3000/dashboard/fia): ask how to use the student parts of FMS.

WHAT YOU CANNOT DO:
- You do not have admin, supervisor-only, or evaluator-only screens.
- Do not expect to access other students' private data beyond public lists (e.g. approved groups).

COMMON STUDENT QUESTIONS:
- "How do I register a group?" → Register Group; pick supervisor and members within limits.
- "Where is my approval?" → Request Status.
- "How do I chat with my team?" → Chat rooms (after you are in a group with access).
- "Why is nothing loading?" → Often: your session is not the active session — check with admin.
`,

  Supervisor: `
ROLE: Supervisor (project supervisor)

WHAT FMS IS FOR YOU:
You review group requests from students assigned to you, supervise accepted groups, set up meetings,
optionally enter D1-related marks on the supervisor path, and use group chat with your groups.

NAVIGATION (YOUR MENU OVERVIEW):
- Chat rooms (http://localhost:3000/dashboard/chat-rooms): talk with each supervised group that has chat enabled for you.
- Domains, policy, resources, events: same read-only style pages as students for context
  (http://localhost:3000/dashboard/all-domains, http://localhost:3000/dashboard/domains-supervisors, http://localhost:3000/dashboard/session-policy,
  http://localhost:3000/dashboard/fyp-resources, http://localhost:3000/dashboard/fyp-events).
- Create Meeting (http://localhost:3000/dashboard/create-meeting), All Meetings (http://localhost:3000/dashboard/all-meetings): schedule and list meetings.
- Supervisor Allocation Status (http://localhost:3000/dashboard/supervisor-allocation): see allocation picture for your session.
- Group Requests (http://localhost:3000/dashboard/supervisor/group-requests): pending student groups needing your accept/reject.
- My groups (http://localhost:3000/dashboard/my-groups): your accepted / supervised groups.
- All registered groups (http://localhost:3000/dashboard/all-groups): fully approved groups for the cohort.
- Give D1 marks — supervisor path (http://localhost:3000/dashboard/supervisor/give-d1-marks/): D1 marking workflow for supervisors.
- Chat with FIA (http://localhost:3000/dashboard/fia): ask how to use the supervisor parts of FMS.

WORKFLOW NOTES:
- Students register groups and select you — you act on Group Requests first when required by policy.
- Capacity: sessions define max groups per supervisor; the platform may block acceptance if at capacity.
- After your action, admins may still need to complete final approval for overall registration.

WHAT YOU CANNOT DO:
- You cannot manage global session settings, all-student CRUD, or evaluator panels as an admin.
- You cannot see evaluator-only administration screens.

COMMON SUPERVISOR QUESTIONS:
- "Where do I approve a group?" → Group Requests.
- "Where are my groups?" → My groups and All registered groups.
- "How do I meet with students?" → Create Meeting / All Meetings and Chat rooms.
`,

  Evaluator: `
ROLE: Evaluator (Defense / assessment panel member)

WHAT FMS IS FOR YOU:
Evaluators participate in Defense 1 (D1) panels: see which groups they assess and enter D1 marks
on the evaluator path. You also have read access to general FYP reference pages.

NAVIGATION (YOUR MENU):
- All domains (http://localhost:3000/dashboard/all-domains), Domains and supervisors (http://localhost:3000/dashboard/domains-supervisors):
  context on domains and supervisors.
- Session policy (http://localhost:3000/dashboard/session-policy): rules for the session.
- FYP resources (http://localhost:3000/dashboard/fyp-resources), FYP Events (http://localhost:3000/dashboard/fyp-events): reference and calendar.
- Complete FYP guide/lifecycle (http://localhost:3000/dashboard/fyp-guide): lifecycle documentation.
- Panels for D1 (http://localhost:3000/dashboard/panels-d1): panels (including yours) and assigned groups for D1.
- Give D1 marks — evaluator path (http://localhost:3000/dashboard/evaluator/give-d1-marks): enter or continue D1 evaluation for assigned groups.
- Chat with FIA (http://localhost:3000/dashboard/fia): ask how to use the evaluator parts of FMS.

WHAT YOU CANNOT DO:
- You cannot configure sessions, approve student groups at institution level, or manage panels/assignment
  (those are admin tasks).
- You cannot access student or supervisor private dashboards beyond what D1 workflows expose.

COMMON EVALUATOR QUESTIONS:
- "Where do I mark D1?" → Give D1 marks (evaluator).
- "Which groups am I assigned to?" → Panels for D1 and the marks screen for your assignments.
`,
};

/** Known JWT roles in this app. */
const ROLE_KEYS = ['Admin', 'Student', 'Supervisor', 'Evaluator'];

export function getFiaContextForRole(role) {
  const key = typeof role === 'string' && ROLE_KEYS.includes(role) ? role : 'Student';
  return FIA_ROLE_CONTEXT[key];
}
