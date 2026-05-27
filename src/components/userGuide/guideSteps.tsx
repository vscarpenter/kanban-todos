"use client";

import { introBoardSteps } from "./introBoardSteps";
import { productivitySteps } from "./productivitySteps";
import { taskWorkflowSteps } from "./taskWorkflowSteps";
import type { GuideStep } from "./guideStepTypes";

export const guideSteps: GuideStep[] = [
  ...introBoardSteps,
  ...taskWorkflowSteps,
  ...productivitySteps,
];
