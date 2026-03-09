export interface ModerationRuleResponse {
  id: number;
  name: string;
  ruleType: string;
  pattern: string;
  isActive: boolean;
  severity: string;
  autoAction: string;
  createdAt: Date;
  updatedAt: Date;
}
