---
name: Academic Excellence
colors:
  surface: '#fbf9f1'
  surface-dim: '#dcdad2'
  surface-bright: '#fbf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ec'
  surface-container: '#f0eee6'
  surface-container-high: '#eae8e0'
  surface-container-highest: '#e4e3db'
  on-surface: '#1b1c17'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1e9'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#2b6954'
  on-tertiary: '#ffffff'
  tertiary-container: '#71af97'
  on-tertiary-container: '#004231'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#b0f0d6'
  tertiary-fixed-dim: '#95d3ba'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#0b513d'
  background: '#fbf9f1'
  on-background: '#1b1c17'
  surface-variant: '#e4e3db'
typography:
  display:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 25px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 13px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin: 20px
  gutter: 12px
---

## Brand & Style

This design system is engineered for high-performance academic environments, balancing the intellectual rigor of a library with the warmth of a focused summer afternoon. The brand personality is scholarly, disciplined, and premium, avoiding the flighty trends of typical consumer apps in favor of a "deep work" aesthetic.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes content density and legibility, using high-contrast typography to create a clear information hierarchy. Instead of heavy glassmorphism, it utilizes tonal layering and precise, subtle shadows to define depth, ensuring the UI feels grounded and permanent. The emotional response is one of calm productivity and quiet luxury.

## Colors

The color palette is dual-natured to support different cognitive states. 

**Summer Warmth (Light Mode)** utilizes a creamy white base (#FFFDF5) to reduce eye strain compared to pure white. Warm yellows and soft orange accents are used for notifications and highlights, mimicking the sensation of sunlight on parchment.

**Emerald Gradient (Dark Mode)** shifts to a sophisticated deep forest green and dark teal foundation. The primary emerald accent (#10B981) provides high-contrast "luminescence" for interactive elements, ensuring clarity in low-light study environments. Emerald is used as the primary driver for progress and success states, while deep teals define the container hierarchy.

## Typography

This design system exclusively employs **Inter** to achieve a neutral, systematic, and utilitarian feel. The typography is optimized for long-form reading and rapid data scanning. 

We utilize tight letter spacing on larger headlines to maintain a premium "editorial" look, while labels use slightly increased tracking and a medium-to-bold weight to ensure legibility at small scales. Semantic hierarchy is enforced through weight shifts rather than just size, keeping the layouts dense but organized.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for iOS. It uses a standard 4-column grid for compact handsets, moving to an 8-column grid for larger Pro Max devices. 

The spacing rhythm is based on a **4px baseline grid**, with 16px (md) being the standard padding for most containers. Screen margins are set at 20px to provide a generous "frame" for academic content, preventing the UI from feeling cluttered. Gutters are kept tight at 12px to maximize the horizontal space available for text and data tables.

## Elevation & Depth

Hierarchy in this design system is established through **Tonal Layers** supplemented by **Ambient Shadows**. 

In Light Mode, elevation is depicted by shifting from the creamy background (#FFFDF5) to pure white (#FFFFFF) for cards and modals. In Dark Mode, depth is created by moving from the dark forest green background to lighter teal "Surface" tiers. 

Shadows are used sparingly; they are extra-diffused with a low opacity (8-12%) and are tinted with the primary emerald or warm orange hues to maintain color harmony. This prevents the "muddy" look of generic black shadows and reinforces the premium, academic feel.

## Shapes

The shape language is **Rounded**, reflecting a modern professional standard that is approachable but structured. 

Standard UI components like buttons and input fields use a 0.5rem (8px) corner radius. Larger containers, such as dashboard cards or academic modules, use `rounded-lg` (16px) to create a distinct visual separation from the background. This moderate roundedness avoids the playfulness of pill-shapes while moving away from the clinical harshness of sharp corners.

## Components

**Buttons:** Primary buttons use the Emerald (#10B981) fill in both modes. Light mode secondary buttons use a soft orange border with the creamy background. Labels are centered and use `label-md` weight.

**Cards:** Cards are the primary container for academic data. They feature a 1px stroke (slightly darker than the surface color) and the "subtle shadow" profile. No heavy blur or transparency.

**Inputs:** Fields use a subtle inset shadow to appear recessed. The focus state is indicated by a 2px Emerald border and a very soft outer glow.

**Chips/Tags:** Used for academic subjects or status. They use a low-saturation version of the accent colors (e.g., a very pale orange background with dark orange text) to remain readable without distracting from the main content.

**Lists:** Standard iOS-style list rows with 16px horizontal padding. Separators are high-contrast in Light Mode (warm grey) and low-contrast in Dark Mode (deep teal).

**Academic Modules:** A custom component for syllabus or course tracking, featuring a vertical progress bar in Emerald and high-contrast Inter typography for titles.