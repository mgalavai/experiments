# LDraw physical-part explosion

## Problem

The current explode animation moves every rendered mesh. GLTFLoader can split one LDraw part into several meshes when it uses multiple materials. Moving those meshes independently tears tires and other compound parts into tread sections, polygons, and material fragments.

## Design

Use the LDraw metadata already preserved in the GLB hierarchy. A movable unit is a scene node whose `userData.type` is `Part` or `Unofficial_Part`. Nodes marked `Unofficial_Subpart`, model assemblies, shortcuts, and raw meshes are not movable units.

For each movable part, calculate one explosion direction from the bounding box of the complete node. Store the node's original local position and its exploded local position. Animate the node transform so every descendant mesh, material primitive, and geometric subpart moves together.

If physical-part nodes are nested, select the outer physical-part node and exclude its physical-part descendants from the animation. This prevents double translation. Shortcut nodes remain containers, allowing their physical child parts, such as a tire and rim, to separate independently.

## Runtime behavior

- `Explode` moves complete LEGO parts only.
- `Assemble` restores the exact original local transforms.
- Orbiting, lighting, reset behavior, compressed loading, and idle render-on-demand remain unchanged.
- Shadows update after each transition rather than during every animation frame.

## Verification

Build and lint must pass. Visual testing must check an exploded wheel at close range, confirm tire tread and material sections remain attached, confirm tire and rim can separate as complete parts, and confirm `Assemble` restores the intact model.
