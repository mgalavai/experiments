# Field Test build-step slider

## Scope

Replace the binary exploded state with a manual assembly-step control based on the `buildingStep` metadata already stored on the GLB part nodes. Remove the global navigation and the complete left header block from `/field-test`. Keep the status, model information, lighting control, camera reset, floor clearance, and physical-part grouping unchanged.

## Interaction

The slider ranges from step 0 through the highest step found in the loaded model, currently 159. The highest step displays the complete model. Lowering the value moves every physical part whose `buildingStep` is greater than the selected value to its existing exploded target. Raising the value restores those parts to their exact authored transforms.

Parts inside the four `42081 - wheel1.ldr` and `42081 - wheel2.ldr` model nodes use layered axle movement instead of radial movement. Move black rubber and the inner wheel hardware 2.4 scene units outward along the wheel axle. Move LDraw yellow parts with color code `14` 3.8 scene units along the same axis. This preserves each part's MPD `buildingStep`, keeps compound geometry intact, and leaves 1.4 scene units between the yellow layer and the rubber layer to prevent visual collisions.

The existing primary button remains as a shortcut. It jumps to step 0 when the model is complete and returns to the highest step from any partially exploded state. The label switches between `Explode` and `Assemble` accordingly.

## Layout

Place the step label, numeric value, and range input in the existing right-side model panel. Do not add a new overlay. Hide the shared application navigation only on `/field-test`. Remove the entire `.field-test-header` element and its unused CSS.

## Rendering and safety

Slider changes update part transforms and render one frame. They do not start a continuous render loop. Shadow maps update after each change. Existing part-level explosion targets and the world-space floor clamp remain the source of truth.

## Verification

Check steps 159, the wheel range from 145 through 155, and 0. Confirm that the visible part sequence follows `buildingStep`, black rubber stays intact, yellow wheel parts sit beyond the rubber without intersections, no part crosses the floor, returning to 159 restores the model, and the nav and left header are absent on desktop and mobile layouts.
