---
name: Academic Emerald
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#95d3ba'
  on-secondary: '#003829'
  secondary-container: '#0b513d'
  on-secondary-container: '#83c2a9'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#00b982'
  on-tertiary-container: '#00422c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 40px
---

## Brand & Style

This design system is engineered for a premium academic experience, blending the intellectual authority of traditional institutions with the sleek, fluid interface of high-end modern software. The brand personality is scholarly, focused, and sophisticated. 

The aesthetic style is a hybrid of **Minimalism** and **Glassmorphism**, leveraging the depth and translucency of the iOS design language. It utilizes deep, atmospheric gradients to create a sense of focus, while vibrant emerald accents guide the user's attention to critical actions and data points. The goal is to evoke the feeling of a quiet, high-tech library—a space designed for deep work and clarity.

## Colors

The palette for this design system is built on a foundation of deep, ink-like slates and rich emerald greens. The primary background is not a flat black, but a "Slate-Emerald" gradient that provides a sense of infinite depth.

*   **Primary (Vibrant Emerald):** Used for primary actions, progress indicators, and active states. It provides high-contrast visibility against dark backgrounds.
*   **Secondary (Deep Emerald):** Used for large surface areas and subtle containers, grounding the UI in the academic theme.
*   **Neutral (Slate-950):** The core background color, ensuring maximum legibility for text and reducing eye strain during long study sessions.
*   **Accents:** Mint and Teal variations are used sparingly for success states or secondary data visualization to maintain a monochromatic, high-end feel.

## Typography

Typography in this design system prioritizes the "Academic" aspect of the prompt. We utilize a dual-font strategy:

*   **Inter** is used for all text to achieve a neutral, systematic, and utilitarian feel. The typography is optimized for long-form reading and rapid data scanning.

High contrast is maintained by using pure white (#FFFFFF) for primary body text and a slightly muted "Slate-300" for secondary information.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for the iOS form factor. A strict 8px rhythmic system governs all margins and padding. 

Key layout principles:
*   **Generous Margins:** Content is inset by 24px on mobile to create a premium, uncrowded feel.
*   **Verticality:** The layout emphasizes vertical flow, with clear section breaks using 40px gaps to distinguish between different academic modules (e.g., "Recent Papers" vs "Upcoming Deadlines").
*   **Safe Areas:** Strict adherence to iOS safe areas, ensuring that interactive elements are never obscured by system notches or home indicators.

## Elevation & Depth

Hierarchy in this design system is established through **Glassmorphism** and tonal layering rather than traditional heavy shadows.

*   **Surface Containers:** Use a semi-transparent Slate-800 with a 20px background blur (`backdrop-filter`).
*   **Borders:** Elements are defined by thin, 1px "inner glows"—semi-transparent white or emerald borders that make cards pop against the dark background.
*   **Atmospheric Depth:** The lowest layer is a deep emerald radial gradient that follows the user's scroll or touch, creating a tactile sense of movement.
*   **Active Elevation:** When an element is interacted with, its background opacity increases, and a soft, emerald-tinted outer glow is applied to signify it is "lifted."

## Shapes

The shape language is consistently **Rounded**, mirroring the Apple hardware aesthetic. 

*   **Primary Containers:** Use a 1rem (16px) corner radius for a friendly yet structured appearance.
*   **Secondary Elements:** Small buttons or tags use a slightly tighter radius (8px), while main action buttons utilize the "Pill" style for maximum touch-target visibility.
*   **Consistency:** Every interactive surface must share the same corner smoothing (squircle-like) to maintain the high-end iOS feel.

## Components

### Buttons
Primary buttons are vibrant emerald with white text, utilizing a subtle "inner-shadow" to appear slightly convex. Secondary buttons are "Ghost" style with an emerald border and glass-blur background.

### Cards
Cards are the primary organizational unit. They must use the `backdrop-filter: blur(20px)` property with a 10% white border. Inside cards, `Inter` is used for titles and metadata.

### Chips & Tags
Academic tags (e.g., "Biology," "Exam," "Research") should use a low-opacity emerald background with high-opacity emerald text. These should be pill-shaped.

### Input Fields
Inputs follow a "minimalist slate" look—darker than the main background, with an emerald bottom-border that illuminates when the field is focused.

### Additional Components
*   **Progress Rings:** Vibrant emerald circular indicators for course completion or study goals.
*   **Document Preview:** A blurred, translucent list item style for PDF or citation management, highlighting the high-end academic nature of the app.