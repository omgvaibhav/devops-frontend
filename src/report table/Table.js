import React, { useState, useEffect } from "react";
import { Octokit } from "octokit";
import "./Table.css";

const owner = "D2RTECHDEV";
const repo = "ONDC-SellerApp";
const pat = "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";

const octokit = new Octokit({ auth: pat });

export default function WorkflowRunsTable() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [artifactInfo, setArtifactInfo] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const response = await octokit.request(
        "GET /repos/{owner}/{repo}/branches",
        {
          owner: owner,
          repo: repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      setBranches(response.data.map((branch) => branch.name));
    };

    fetchBranches();
  }, []);

  const handleBranchChange = async () => {
    const branch_name = selectedBranch;
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/actions/workflows",
      {
        owner: owner,
        repo: repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const workflows = response.data.workflows;
    const runsResponse = await Promise.all(
      workflows.map((workflow) =>
        octokit.request(
          "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
          {
            owner: owner,
            repo: repo,
            workflow_id: workflow.id,
            per_page: 10,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        )
      )
    );

    console.log(branch_name);
    console.log(runsResponse);
    const runs = runsResponse.flatMap((res) => res.data.workflow_runs);

    const artifactResponse = await Promise.all(
      runs.map((run) =>
        octokit.request(
          "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
          {
            owner: owner,
            repo: repo,
            run_id: run.id,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        )
      )
    );
    //console.log(artifactResponse);

    const artifacts = artifactResponse.map((res) => ({
      count: res.data.total_count,
      artifact: res.data.artifacts.map((data) => ({
        name: data.name,
        id: data.id,
        runId: data.workflow_run.id,
        branch: data.workflow_run.head_branch,
      })),
    }));

    console.log(artifacts);
    setArtifactInfo(artifacts);
    if (branch_name === "All") {
      //console.log(runs);
      setWorkflowRuns(
        runs.map((run) => ({
          project: run.head_repository.name,
          branchName: run.head_branch,
          buildLog: run.html_url,
          runId: run.id,
          workflowName: run.name,
          TimeStamp: run.created_at,
        }))
      );
    } else {
      const workflow_runs = runs.filter(
        (run) => run.head_branch === branch_name
      );
      setWorkflowRuns(
        workflow_runs.map((run) => ({
          project: run.head_repository.name,
          branchName: run.head_branch,
          buildLog: run.html_url,
          runId: run.id,
          workflowName: run.name,
          TimeStamp: run.created_at,
        }))
      );
    }
  };

  useEffect(() => {
    handleBranchChange();
  }, [selectedBranch]);

  // useEffect(() => {
  //   console.log(workflowRuns);
  // }, [workflowRuns]);

  return (
    <div>
      <label htmlFor="branch">Select a branch</label>
      <select
        id="branch"
        onChange={(e) => setSelectedBranch(e.target.value)}
        value={selectedBranch}
      >
        <option value="All">All</option>
        {branches.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>

      <table>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Branch</th>
            <th>Workflow</th>
            <th>Run ID</th>
            <th>Time Stamp</th>
            <th>Build Log</th>
            <th>Test Log</th>
            <th>Coverage Report</th>
          </tr>
        </thead>
        <tbody>
          {workflowRuns.map((data) => {
            const matchingArtifactsInfo = artifactInfo.find((info) =>
              info.artifact.some((artifact) => artifact.runId === data.runId)
            );

            // Extract the IDs for test-results and coverage-report
            const testResultsArtifact = matchingArtifactsInfo?.artifact.find(
              (artifact) => artifact.name === "test-results"
            );
            const coverageReportArtifact = matchingArtifactsInfo?.artifact.find(
              (artifact) => artifact.name === "coverage-report"
            );

            // Initialize variables for artifact IDs
            let testResultsId = "None";
            let coverageReportId = "None";

            // Check if artifacts exist and set IDs
            if (testResultsArtifact) {
              testResultsId = testResultsArtifact.id;
            }
            if (coverageReportArtifact) {
              coverageReportId = coverageReportArtifact.id;
            }
            return (
              <tr key={data.runId}>
                <td>{data.project}</td>
                <td>{data.branchName}</td>
                <td>{data.workflowName}</td>
                <td>{data.runId}</td>
                <td>{data.TimeStamp}</td>
                <td>
                  <a
                    href={data.buildLog}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </td>
                <td>
                  {testResultsId === "None" ? (
                    <p>None</p>
                  ) : (
                    <button
                      onClick={() =>
                        window.open(
                          `https://report-backend-iyfl.onrender.com/artifact/test/${testResultsId}`,
                          "_blank"
                        )
                      }
                      rel="noopener noreferrer"
                    >
                      View
                    </button>
                  )}
                </td>
                <td>
                  {coverageReportId === "None" ? (
                    <p>None</p>
                  ) : (
                    <button
                      onClick={() =>
                        window.open(
                          `https://report-backend-iyfl.onrender.com/${coverageReportId}`,
                          "_blank"
                        )
                      }
                      rel="noopener noreferrer"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
