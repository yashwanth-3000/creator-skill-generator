import type { Metadata } from "next";
import { AppFrame } from "@/components/product/app-frame";
import { CreateSkillWizard } from "@/components/product/create-skill-wizard";

export const metadata: Metadata = {
  title: "Create New Skill — Creator Skill Generator",
  description: "Generate a skill bundle from raw content, a Twitter/X account, or YouTube videos.",
};

export default function CreateNewSkillPage() {
  return (
    <AppFrame currentPage="create" hideFooter>
      <CreateSkillWizard />
    </AppFrame>
  );
}
