import { materialsDB } from "@/lib/materials-db";
import AppShell from "@/components/AppShell";

export default function HomePage(): JSX.Element {
  return (
    <AppShell
      databaseSize={materialsDB.length}
      llmEnabled={Boolean(process.env.GEMINI_API_KEY)}
    />
  );
}
