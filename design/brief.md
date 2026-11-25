# Veil design brief

Security and privacy teams need a way to see what happens to sensitive information before an AI request is sent or a response is shared. Prompt Review gives them a split view with the source on the left, the result on the right, and the policy and scan controls above both. An explicit scan makes each findings entry traceable to a deliberate action.

The chosen concept uses an evergreen sidebar, warm paper surfaces, serif headings, and a lightly tinted result panel. The desktop two-column layout stacks on smaller screens. Findings show data type and match count without repeating detected values. Policy editing and the session log use the same navigation and palette.

[Policy Studio concept](policy-studio-concept.png) explores a rules-first entry point. [Incident Queue concept](incident-queue-concept.png) explores triage as the entry point. The selected Prompt Review concept is shown in the original conversation. The repository includes the rendered [desktop](prompt-review-desktop.png) and [mobile](prompt-review-mobile.png) designs.

## Offering to validate

Start with policy simulation for teams rolling out AI assistants. Test with representative synthetic and approved evaluation data, and measure precision, recall, review time, and the rate of mistaken blocks by data type. Once the detectors and workflows meet a pilot team's requirements, evaluate gateway integration, versioned policy rollout, approval workflows, and retention controls for metadata.
