import type { BuilderField } from "@/lib/smart-forms/types";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";

export type FieldLayoutBlock =
  | { kind: "section"; field: BuilderField; columns: 1 | 2 }
  | { kind: "divider"; field: BuilderField }
  | { kind: "row"; fields: BuilderField[]; columns: 1 | 2 };

export function buildFieldLayoutBlocks(fields: BuilderField[]): FieldLayoutBlock[] {
  const blocks: FieldLayoutBlock[] = [];
  let sectionColumns: 1 | 2 = 1;

  let pendingRow: BuilderField[] = [];

  function flushRow() {
    if (pendingRow.length === 0) return;
    blocks.push({ kind: "row", fields: pendingRow, columns: sectionColumns });
    pendingRow = [];
  }

  for (const field of fields) {
    if (field.fieldType === "SECTION") {
      flushRow();
      sectionColumns = field.sectionColumns === 2 ? 2 : 1;
      blocks.push({ kind: "section", field, columns: sectionColumns });
      continue;
    }

    if (field.fieldType === "DIVIDER") {
      flushRow();
      blocks.push({ kind: "divider", field });
      continue;
    }

    const isHalf = field.width === "half" && sectionColumns === 2;

    if (!isHalf) {
      flushRow();
      blocks.push({ kind: "row", fields: [field], columns: 1 });
      continue;
    }

    pendingRow.push(field);
    if (pendingRow.length === 2) flushRow();
  }

  flushRow();
  return blocks;
}

export function fieldCanBeHalfWidth(field: BuilderField): boolean {
  return getFieldTypeMeta(field.fieldType).isInput && field.fieldType !== "TEXTAREA";
}

/** Column layout for the section that contains `fieldId` (defaults to 1). */
export function getSectionColumnsForField(
  fields: BuilderField[],
  fieldId: string,
): 1 | 2 {
  let columns: 1 | 2 = 1;
  for (const field of fields) {
    if (field.fieldType === "SECTION") {
      columns = field.sectionColumns === 2 ? 2 : 1;
    }
    if (field.id === fieldId) return columns;
  }
  return columns;
}

/** Active section column layout at the end of the field list. */
export function getTrailingSectionColumns(fields: BuilderField[]): 1 | 2 {
  let columns: 1 | 2 = 1;
  for (const field of fields) {
    if (field.fieldType === "SECTION") {
      columns = field.sectionColumns === 2 ? 2 : 1;
    }
  }
  return columns;
}
