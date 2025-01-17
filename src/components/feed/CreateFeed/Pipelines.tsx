import React from "react";
import {
  Button,
  DataList,
  DataListItem,
  DataListCell,
  DataListItemRow,
  DataListItemCells,
  DataListToggle,
  Pagination,
  DataListAction,
  DataListContent,
} from "@patternfly/react-core";
import { Spin } from "antd";

import {
  Tree,
  ConfigurationPage,
  UploadJson,
  GeneralCompute,
} from "../Pipelines/";
import { fetchPipelines, generatePipelineWithName } from "../../../api/common";
import { PipelinesProps } from "./types/pipeline";

const Pipelines = ({
  justDisplay,
  state,
  handleDispatchPipelines,
  handleSetPipelineResources,
  handleUploadDispatch,
  handleSetCurrentNode,
  handleCleanResources,
  handlePipelineSecondaryResource,
  handleSetPipelineEnvironments,
  handleSetCurrentNodeTitle,
  handleSetGeneralCompute,
  handleTypedInput,
  handleDeleteInput,
  handleSetCurrentComputeEnv,
}: PipelinesProps) => {
  const { pipelineData, selectedPipeline, pipelines } = state;

  const [pageState, setPageState] = React.useState({
    page: 1,
    perPage: 10,
    search: "",
    itemCount: 0,
  });

  const [expanded, setExpanded] = React.useState<{ [key: string]: boolean }>();
  const { page, perPage } = pageState;

  const handleDispatchWrap = React.useCallback(
    (registeredPipelines: any) => {
      handleDispatchPipelines(registeredPipelines);
    },
    [handleDispatchPipelines]
  );

  React.useEffect(() => {
    fetchPipelines(perPage, page).then((result: any) => {
      const { registeredPipelines, registeredPipelinesList } = result;
      if (registeredPipelines) {
        handleDispatchWrap(registeredPipelines);
        setPageState((pageState) => {
          return {
            ...pageState,
            itemCount: registeredPipelinesList.totalCount,
          };
        });
      }
    });
  }, [perPage, page, handleDispatchWrap]);

  const handleNodeClick = async (nodeName: number, pipelineId: number) => {
    handleSetCurrentNode(pipelineId, nodeName);
  };

  const onSetPage = (_event: any, page: number) => {
    setPageState({
      ...pageState,
      page,
    });
  };
  const onPerPageSelect = (_event: any, perPage: number) => {
    setPageState({
      ...pageState,
      perPage,
    });
  };

  return (
    <>
      <UploadJson handleDispatch={handleUploadDispatch} />
      <Pagination
        itemCount={pageState.itemCount}
        perPage={pageState.perPage}
        page={pageState.page}
        onSetPage={onSetPage}
        onPerPageSelect={onPerPageSelect}
      />

      <DataList aria-label="pipeline list">
        {pipelines.length > 0 &&
          pipelines.map((pipeline: any) => {
            return (
              <DataListItem
                isExpanded={
                  expanded && expanded[pipeline.data.id] ? true : false
                }
                key={pipeline.data.id}
              >
                <DataListItemRow>
                  <DataListToggle
                    id={pipeline.data.id}
                    aria-controls="expand"
                    onClick={async () => {
                      if (
                        !(expanded && expanded[pipeline.data.id]) ||
                        !state.pipelineData[pipeline.data.id]
                      ) {
                        const { resources } = await generatePipelineWithName(
                          pipeline.data.name
                        );

                        handleSetPipelineResources({
                          ...resources,
                          pipelineId: pipeline.data.id,
                        });

                        setExpanded({
                          ...expanded,
                          [pipeline.data.id]: true,
                        });
                      } else {
                        setExpanded({
                          ...expanded,
                          [pipeline.data.id]: false,
                        });
                      }
                    }}
                  />
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key={pipeline.data.name}>
                        <div
                          className="plugin-table-row"
                          key={pipeline.data.name}
                        >
                          <span className="plugin-table-row__plugin-name">
                            {pipeline.data.name}
                          </span>
                          <span
                            className="plugin-table-row__plugin-description"
                            id={`${pipeline.data.description}`}
                          >
                            <em>{pipeline.data.description}</em>
                          </span>
                        </div>
                      </DataListCell>,
                    ]}
                  />
                  <DataListAction
                    aria-labelledby="select a pipeline"
                    id={pipeline.data.id}
                    aria-label="actions"
                    className="pipelines"
                  >
                    {!justDisplay && (
                      <Button
                        variant="tertiary"
                        key="select-action"
                        onClick={async () => {
                          if (!(selectedPipeline === pipeline.data.id)) {
                            handlePipelineSecondaryResource(pipeline);
                            if (!pipelineData[pipeline.data.id]) {
                              const { resources } =
                                await generatePipelineWithName(
                                  pipeline.data.name
                                );

                              handleSetPipelineResources({
                                ...resources,
                                pipelineId: pipeline.data.id,
                              });
                            }
                          } else {
                            handleCleanResources();
                          }
                        }}
                      >
                        {selectedPipeline === pipeline.data.id
                          ? "Deselect"
                          : "Select"}
                      </Button>
                    )}

                    <Button
                      key="delete-action"
                      onClick={async () => {
                        const filteredPipelines = pipelines.filter(
                          (currentPipeline: any) => {
                            return currentPipeline.data.id !== pipeline.data.id;
                          }
                        );
                        handleDispatchPipelines(filteredPipelines);
                        await pipeline.delete();
                      }}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </DataListAction>
                </DataListItemRow>
                <DataListContent
                  id={pipeline.data.id}
                  aria-label="PrimaryContent"
                  isHidden={!(expanded && expanded[pipeline.data.id])}
                >
                  {(expanded && expanded[pipeline.data.id]) ||
                  state.pipelineData[pipeline.data.id] ? (
                    <>
                      <div style={{ display: "flex", background: "black" }}>
                        <Tree
                          state={state.pipelineData[pipeline.data.id]}
                          currentPipelineId={pipeline.data.id}
                          handleNodeClick={handleNodeClick}
                          handleSetCurrentNode={handleSetCurrentNode}
                          handleSetPipelineEnvironments={
                            handleSetPipelineEnvironments
                          }
                          handleSetCurrentNodeTitle={handleSetCurrentNodeTitle}
                        />
                        <GeneralCompute
                          handleSetGeneralCompute={handleSetGeneralCompute}
                          currentPipelineId={pipeline.data.id}
                        />
                      </div>

                      <ConfigurationPage
                        justDisplay={justDisplay}
                        pipelines={pipelines}
                        pipeline={pipeline}
                        currentPipelineId={pipeline.data.id}
                        state={state.pipelineData[pipeline.data.id]}
                        handleTypedInput={handleTypedInput}
                        handleSetCurrentNodeTitle={handleSetCurrentNodeTitle}
                        handleDispatchPipelines={handleDispatchPipelines}
                        handleDeleteInput={handleDeleteInput}
                        handleSetCurrentComputeEnv={handleSetCurrentComputeEnv}
                      />
                    </>
                  ) : (
                    <Spin>Fetching Pipeline Resources</Spin>
                  )}
                </DataListContent>
              </DataListItem>
            );
          })}
      </DataList>
    </>
  );
};

export default Pipelines;
