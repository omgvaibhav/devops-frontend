import React, { useState, useEffect } from "react";
import { Octokit } from "octokit";
import "./Table.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { getAccessToken, getAdmin } from "../login/auth";
import axios from "axios";
import JSZip from "jszip";

const owner = "D2RTECHDEV";
const repo = "ONDC-SellerApp";
const pat = "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";

const octokit = new Octokit({ auth: pat });

export default function WorkflowRunsTable() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [artifactInfo, setArtifactInfo] = useState([]);
  const [passRates, setPassRates] = useState({});

  // const toks = getAccessToken();
  // console.log(toks);
  //console.log(isAdmin);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const isAdmin = getAdmin();
  //console.log(isAdmin);

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

  useEffect(() => {
    handleBranchChange();
  }, [selectedBranch]);

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

    console.log(`selected branch: ${branch_name}`);
    //console.log(runsResponse);
    const runs = runsResponse.flatMap((res) => res.data.workflow_runs);
    //onsole.log(runs);
    const firstRunId = runs[0]?.id;
    //console.log(firstRunId);
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

    const fetchPassRateArtifact = await octokit.request(
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
      {
        owner: owner,
        repo: repo,
        run_id: firstRunId,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    //console.log(fetchPassRateArtifact.data);
    const rateArtifact = fetchPassRateArtifact.data.artifacts.filter(
      (artifact) => artifact.name === "test-pass-rates"
    );
    //console.log(rateArtifact);
    const passRateId = rateArtifact[0]?.id;
    //console.log(passRateId);

    octokit
      .request(
        "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
        {
          owner: owner,
          repo: repo,
          artifact_id: passRateId,
          archive_format: "zip",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      )
      .then(async (res) => {
        const zipData = res.data;
        const zip = new JSZip();
        zip
          .loadAsync(zipData)
          .then((zip) => {
            return zip.file("test-pass-rates.json").async("uint8array");
          })
          .then((uint8Array) => {
            const jsonContent = new TextDecoder().decode(uint8Array);
            const data = JSON.parse(jsonContent);
            setPassRates(data);
          })
          .catch((e) => console.error(e));
      })
      .catch((e) => console.error(e));

    //console.log(passRates);

    const artifacts = artifactResponse.map((res) => ({
      count: res.data.total_count,
      artifact: res.data.artifacts.map((data) => ({
        name: data.name,
        id: data.id,
        runId: data.workflow_run.id,
        branch: data.workflow_run.head_branch,
      })),
    }));

    //console.log(artifacts);
    setArtifactInfo(artifacts);

    if (branch_name === "All") {
      //console.log(runs);
      setWorkflowRuns(
        runs.map((run) => ({
          project: run.head_repository.name,
          branchName: run.head_branch,
          user: run.actor.login,
          conclusion: run.conclusion,
          buildLog: run.html_url,
          runId: run.id,
          workflowName: run.name,
          TimeStamp: formatUnixTimestamp(run.created_at),
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
          user: run.actor.login,
          conclusion: run.conclusion,
          buildLog: run.html_url,
          runId: run.id,
          workflowName: run.name,
          TimeStamp: formatUnixTimestamp(run.created_at),
        }))
      );
    }
  };

  function formatUnixTimestamp(timestamp) {
    const date = new Date(timestamp);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return date.toLocaleDateString("en-US", options);
  }

  const handleArtifact = async (id) => {
    try {
      const token = getAccessToken();
      const response = await axios.get(`${apiUrl}/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: "Bearer " + token,
        },
        maxRedirects: 0,
      });
      if (response.status === 200) {
        const redirect = response.data.URL;
        //console.log(redirect);
        window.open(redirect, "_blank");
      }
    } catch (e) {
      alert("Unauthorized");
      console.error(`error in making api call:\n${e}`);
    }
  };

  function getPassRateColor(passRate) {
    if (passRate === undefined || passRate === null) {
      return 'black';
    } else if (passRate < 90) {
      return 'red';
    } else {
      return 'green';
    }
  }

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
            {isAdmin && <th>User</th>}
            <th>Workflow</th>
            <th>Run ID</th>
            <th>Status</th>
            <th>Time Stamp</th>
            <th>Build Log</th>
            <th>Test pass rate</th>
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
                {isAdmin && <td>{data.user}</td>}
                <td>{data.workflowName}</td>
                <td>{data.runId}</td>
                <td>
                  {data.conclusion === "success" ? (
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      size="lg"
                      style={{ marginLeft: "15px", color: "#55a654" }}
                    />
                  ) : data.conclusion === "failure" ? (
                    <FontAwesomeIcon
                      icon={faCircleXmark}
                      size="lg"
                      style={{ marginLeft: "15px", color: "#d61f1f" }}
                    />
                  ) : data.conclusion == null ? (
                    <span>Queued</span>
                  ) : (
                    <span>{data.conclusion}</span> // Display data.conclusion if neither condition is met
                  )}
                </td>
                <td>{data.TimeStamp}</td>
                <td>
                  <button
                    disabled={!isAdmin}
                    onClick={() => window.open(data.buildLog, "_blank")}
                    rel="noopener noreferrer"
                  >
                    View
                  </button>
                </td>
                <td
                  style={{ color: getPassRateColor(passRates[data.runId])}}>
                  {passRates[data.runId]!==undefined  ? `${passRates[data.runId]} %` : "N/A"}
                </td>
                <td>
                  {testResultsId === "None" ? (
                    <p>None</p>
                  ) : (
                    <button
                      disabled={!isAdmin}
                      onClick={() =>
                        handleArtifact(`artifact/test/${testResultsId}`)
                      }
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
                      disabled={!isAdmin}
                      onClick={() =>
                        handleArtifact(`artifact/coverage/${coverageReportId}`)
                      }
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
