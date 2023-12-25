import {
  ArrowTopRightOnSquareIcon,
  Cog8ToothIcon,
  TicketIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Icon } from "@tremor/react";
import { AlertDto, AlertKnownKeys } from "./models";
import { Workflow } from "app/workflows/models";

const getExtraPayloadNoKnownKeys = (alert: AlertDto) =>
  Object.fromEntries(
    Object.entries(alert).filter(([key]) => !AlertKnownKeys.includes(key))
  );

const getRelevantWorkflows = (alert: AlertDto, workflows: Workflow[]) => {
  const extraPayloadNoKnownKeys = getExtraPayloadNoKnownKeys(alert);

  return workflows.filter((workflow) => {
    const alertTrigger = workflow.triggers.find(
      (trigger) => trigger.type === "alert"
    );

    const workflowIsRelevant = alertTrigger?.filters?.every((filter) => {
      if (filter.key === "source") {
        return alert.source?.includes(filter.value);
      }
      return (
        (alert as any)[filter.key] === filter.value ||
        extraPayloadNoKnownKeys[filter.key] === filter.value
      );
    });
    return workflowIsRelevant;
  });
};

interface Props {
  alert: AlertDto;
  workflows: Workflow[];
  handleWorkflowClick: (workflows: Workflow[]) => void;
}

export default function AlertName({
  alert,
  workflows,
  handleWorkflowClick,
}: Props) {
  const {
    name,
    url,
    generatorURL,
    deleted,
    lastReceived,
    ticket_url: ticketUrl,
  } = alert;

  const relevantWorkflows = getRelevantWorkflows(alert, workflows);

  return (
    <div className="max-w-[340px]">
      <div className="flex items-center justify-between">
        <div className="truncate" title={alert.name}>
          {name}{" "}
        </div>
        <div>
          {(url ?? generatorURL) && (
            <a href={url || generatorURL} target="_blank">
              <Icon
                icon={ArrowTopRightOnSquareIcon}
                tooltip="Open Original Alert"
                color="gray"
                variant="solid"
                size="xs"
                className="ml-1"
              />
            </a>
          )}
          {ticketUrl && (
            <a href={ticketUrl} target="_blank">
              <Icon
                icon={TicketIcon}
                tooltip="Ticket Assigned"
                size="xs"
                color="gray"
                className="ml-1"
                variant="solid"
              />
            </a>
          )}
          {deleted.includes(lastReceived.toISOString()) && (
            <Icon
              icon={TrashIcon}
              tooltip="This alert has been deleted"
              size="xs"
              color="gray"
              className="ml-1"
              variant="solid"
            />
          )}
          {relevantWorkflows.length > 0 && (
            <Icon
              icon={Cog8ToothIcon}
              size="xs"
              color={`${
                relevantWorkflows.every(
                  (wf) => wf.last_execution_status === "success"
                )
                  ? "green"
                  : relevantWorkflows.some(
                      (wf) => wf.last_execution_status === "error"
                    )
                  ? "red"
                  : relevantWorkflows.some(
                      (wf) =>
                        wf.last_execution_status === "providers_not_configured"
                    )
                  ? "amber"
                  : "gray"
              }`}
              tooltip={`${
                relevantWorkflows.every(
                  (wf) => wf.last_execution_status === "success"
                )
                  ? "All workflows executed successfully"
                  : relevantWorkflows.some(
                      (wf) => wf.last_execution_status === "error"
                    )
                  ? "Some workflows failed to execute"
                  : relevantWorkflows.some(
                      (wf) =>
                        wf.last_execution_status === "providers_not_configured"
                    )
                  ? "Some workflows are not configured"
                  : "Workflows have yet to execute"
              }`}
              onClick={() => handleWorkflowClick(relevantWorkflows)}
              className="ml-1 cursor-pointer"
              variant="solid"
            />
          )}
        </div>
      </div>
    </div>
  );
}
