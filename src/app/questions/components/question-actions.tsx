import { QuestionDialog } from "./QuestionDialog";
import { QuestionEditDialog } from "./QuestionEditDialog";

interface QuestionActionsProps {
  questionId: number;
}

export function QuestionActions({ questionId }: QuestionActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <QuestionDialog questionId={questionId} />
      <QuestionEditDialog questionId={questionId} />
    </div>
  );
}