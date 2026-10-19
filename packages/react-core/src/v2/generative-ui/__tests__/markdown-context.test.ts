import { describe, expect, it } from "vitest";
import { GENERATIVE_UI_MARKDOWN_GUIDELINES } from "@copilotkit/shared";
import { createGenerativeUIDispatcher } from "../dispatcher";
import { buildGenerativeUIManifest } from "../manifest";
import { buildCompactGenerativeUISchema } from "../markdown/context";
import { standardUI } from "../standard";
import { GenerativeUISurfaceManager } from "../surface-manager";

function compactStandardSchema() {
  const manager = new GenerativeUISurfaceManager(standardUI);
  const dispatcher = createGenerativeUIDispatcher({
    getDeclared: () => standardUI.functions,
  });
  const manifest = buildGenerativeUIManifest(
    { ui: standardUI, manager, dispatcher },
    undefined,
  );
  return buildCompactGenerativeUISchema(manifest);
}

describe("buildCompactGenerativeUISchema", () => {
  it("lists the props that many components share once, in commonProps", () => {
    const schema = compactStandardSchema();
    const common = schema.commonProps ?? {};
    // The layout props of every container.
    expect(Object.keys(common)).toEqual(
      expect.arrayContaining(["gap?", "padding?", "border?", "radius?"]),
    );
    expect(schema.components.Column.includesCommonProps).toBe(true);
    expect(schema.components.Column.props).not.toHaveProperty("gap?");
    expect(schema.components.Card.includesCommonProps).toBe(true);
    expect(schema.components.Card.props).toHaveProperty("variant?");
    // A component without the layout props keeps all of its own.
    expect(schema.components.Text.includesCommonProps).toBeUndefined();
    expect(schema.components.Text.props).toHaveProperty("text?");
  });

  it("keeps the schema and the guideline of the standard components small", () => {
    const schema = JSON.stringify(compactStandardSchema());
    expect(schema.length).toBeLessThan(42_000);
    expect(
      schema.length + GENERATIVE_UI_MARKDOWN_GUIDELINES.length,
    ).toBeLessThan(46_000);
  });

  it("explains commonProps in the guideline", () => {
    expect(GENERATIVE_UI_MARKDOWN_GUIDELINES).toContain("includesCommonProps");
  });
});
