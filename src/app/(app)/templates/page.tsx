import { getTemplates } from "@/features/templates/data";
import { TemplatesView } from "@/features/templates/templates-view";
import { requirePermission } from "@/server/auth/guards";

export default async function TemplatesPage() {
  await requirePermission("templates.manage");
  const templates = await getTemplates();
  return <TemplatesView templates={templates} />;
}
