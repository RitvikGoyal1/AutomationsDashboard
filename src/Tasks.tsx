import MistralServices from "./classes/MistralServices";
import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SentEmail from "./classes/SentEmail";
import "./App.css";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices";
import User from "./classes/User";
import TaskTree from "./classes/TaskTree";
import TaskNode from "./classes/TaskNode";

interface SentProps {
    accessToken: string | null;
    useMockData?: boolean;
}
// page shows user tasks extracted from their emails
function Tasks({ accessToken, useMockData }: SentProps) {
    const syntheticRootLabel = "__TASKS_ROOT__";
    // tree for storing tasks
    const [taskTree, setTaskTree] = useState<TaskTree | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [, setTreeVersion] = useState(0);
    const [subtaskInputs, setSubtaskInputs] = useState<Map<string, string>>(new Map());
    // count spaces at start of line for indent
    const countLeadingSpaces = (line: string): number => line.length - line.trimStart().length;
    // make sure metadata goes under right task
    const normalizeTaskLines = (lines: string[]): string[] => {
        const normalized: string[] = [];
        let lastTaskIndent = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            // check if its deadline or priority
            if (trimmed.startsWith("Deadline:") || trimmed.startsWith("Priority:")) {
                const leadingSpaces = countLeadingSpaces(line);
                if (leadingSpaces === 0 && normalized.length > 0) {
                    // add indent to match parent task
                    normalized.push(" ".repeat(lastTaskIndent + 2) + trimmed);
                } else {
                    normalized.push(line);
                }
                continue;
            }

            lastTaskIndent = countLeadingSpaces(line);
            normalized.push(line);
        }

        return normalized;
    };

    const buildTaskTree = (rawTasks: string): TaskTree | null => {
        // split into lines
        const rawLines = rawTasks.split("\n").filter((line) => line.trim() !== "");

        if (rawLines.length === 0) {
            return null;
        }

        const normalizedLines = normalizeTaskLines(rawLines);

        const taskLines = [syntheticRootLabel, ...normalizedLines.map((line) => `  ${line}`)];
        return TaskTree.fromTaskLines(taskLines);
    };
    // expand all parent tasks when loading
    const initializeExpandedNodes = (tree: TaskTree | null): void => {
        if (!tree) {
            setExpandedNodes(new Set());
            return;
        }
        const root = tree.getRoot();
        if (!root) {
            setExpandedNodes(new Set());
            return;
        }
        const expanded = new Set<string>([root.getDescription()]);
        // go through tree and expand nodes that have children
        for (const node of tree.traversePreOrder()) {
            if (node.getChildren().length > 0) {
                expanded.add(node.getDescription());
            }
        }
        setExpandedNodes(expanded);
    };
    // check if line is deadline/priority metadata
    const isTaskMetadata = (description: string): boolean =>
        /^\s*(Deadline|Priority)\s*:/i.test(description);
    // toggle node expansion when clicked
    const toggleExpand = (description: string): void => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(description)) {
                next.delete(description);
            } else {
                next.add(description);
            }
            return next;
        });
    };
    // remove task when user checks it off
    const toggleCompleted = (node: TaskNode): void => {
        if (!taskTree) return;
        const description = node.getDescription();
        taskTree.removeTask(description);
        setTreeVersion((current) => current + 1);
    };
    // Add a subtask to a parent node
    // add subtask under parent
    const addSubtask = (parentDescription: string): void => {
        if (!taskTree) return;
        const subtaskText = subtaskInputs.get(parentDescription);
        if (!subtaskText || !subtaskText.trim()) return;

        try {
            taskTree.addTask(parentDescription, subtaskText);
            setSubtaskInputs((prev) => {
                const next = new Map(prev);
                next.set(parentDescription, "");
                return next;
            });
            setTreeVersion((current) => current + 1);
        } catch (error) {
            console.error("Error adding subtask:", error);
        }
    };
    // update input field for adding subtasks
    const updateSubtaskInput = (nodeDescription: string, value: string): void => {
        setSubtaskInputs((prev) => {
            const next = new Map(prev);
            next.set(nodeDescription, value);
            return next;
        });
    };
    // render task node with its children
    const renderTaskNode = (node: TaskNode, depth: number) => {
        const children = node.getChildren();
        // put non-metadata first, then metadata
        const sortedChildren = [...children].sort((a, b) => {
            const aIsMetadata = isTaskMetadata(a.getDescription());
            const bIsMetadata = isTaskMetadata(b.getDescription());
            if (aIsMetadata && !bIsMetadata) return 1;
            if (!aIsMetadata && bIsMetadata) return -1;
            return 0;
        });
        const hasChildren = children.length > 0;
        const isExpanded = expandedNodes.has(node.getDescription());
        const isMetadata = isTaskMetadata(node.getDescription());

        return (
            <div key={node.getDescription()} style={{ marginLeft: `${depth * 20}px` }}>
                <div
                    style={{
                        padding: "10px 15px",
                        borderBottom: "1px solid #ddd",
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <button
                        onClick={() => hasChildren && toggleExpand(node.getDescription())}
                        style={{
                            border: "none",
                            background: "transparent",
                            cursor: hasChildren ? "pointer" : "default",
                            width: "20px",
                            color: "#555",
                        }}
                    >
                        {hasChildren ? (isExpanded ? "▼" : "▶") : "•"}
                    </button>
                    {!isMetadata && (
                        <input
                            type="checkbox"
                            checked={false}
                            onChange={() => toggleCompleted(node)}
                        />
                    )}
                    <span
                        style={{
                            fontSize: "14px",
                            color: isMetadata ? "#555" : "#222",
                            fontStyle: isMetadata ? "italic" : "normal",
                            flex: 1,
                        }}
                    >
                        {node.getDescription()}
                    </span>
                </div>
                {!isMetadata && isExpanded && (
                    <div
                        style={{
                            marginLeft: "28px",
                            padding: "8px 15px",
                            backgroundColor: "#fafafa",
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Add subtask..."
                            value={subtaskInputs.get(node.getDescription()) || ""}
                            onChange={(e) =>
                                updateSubtaskInput(node.getDescription(), e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    addSubtask(node.getDescription());
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: "6px 10px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                fontSize: "13px",
                            }}
                        />
                        <button
                            onClick={() => addSubtask(node.getDescription())}
                            style={{
                                padding: "6px 12px",
                                backgroundColor: "#1a73e8",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "13px",
                            }}
                        >
                            Add
                        </button>
                    </div>
                )}
                {/*Recursively render children if expanded */}
                {isExpanded && sortedChildren.map((child) => renderTaskNode(child, depth + 1))}
            </div>
        );
    };

    // Mock data that can be used to test the task functionality for those who haven't logged in
    const mockEmails = (): SentEmail[] => [
        new SentEmail(
            "Mock1",
            "Meeting Invite",
            "Hey, I hope you are doing well. I just wanted to let you know that we have a meeting scheduled for tomorrow at 5 PM. Please remember to be there, on time! \nRegards,\nAlice",
            new Date(),
            "alice@email.com"
        ),
        new SentEmail(
            "Mock2",
            "Project Update",
            "Hi! It's me Tina! I was working on the System Hardware Project and ran into some difficulties. I am not really sure how long it would take for me to get it up and running, I'd say roughly 2 weeks. I hope you understand. \nRegards,\nTina",
            new Date(Date.now() - 86400000),
            "Tina_to@mail.com"
        ),
        new SentEmail(
            "Mock3",
            "Weekly Report",
            "Good Evening! Just wanted to let you know that I am expecting you to have the weekly report completed by the day after tomorrow, 12 PM. Thanks!",
            new Date(Date.now() - 2 * 86400000),
            "boss@gmail.com"
        ),
        new SentEmail(
            "Mock4",
            "Payment Issues",
            "Hi, I was working on the stripe payment integration and I am not able to receive payments due to an error. Please let me know how to fix it when you have time.",
            new Date(Date.now() - 3 * 86400000),
            "jonny@gmail.com"
        ),
        new SentEmail(
            "Mock5",
            "Promotion",
            "Hey Mate, I got some great news for you! You are getting promoted at the end of the month! We have noticed your hard work and dedication and are grateful for your contributions. Looking forward to your continued success!",
            new Date(Date.now() - 3.5 * 86400000),
            "hr@gmail.com"
        ),
    ];
    // Builds tree based on tasks from mock emails or their hotmail/outlook emails
    useEffect(() => {
        const loadTasksFromMock = async () => {
            const u = new User();
            await MistralServices.getTasks(
                u,
                mockEmails().map((m) => m.getBody())
            );
            const tree = buildTaskTree(u.getTasks());
            setTaskTree(tree);
            initializeExpandedNodes(tree);
        };
        const loadTasksFromGraph = async (token: string) => {
            try {
                const svc = new MicrosoftGraphServices(token);
                const inbox = await svc.getReceivedEmails();
                const u = new User();
                await MistralServices.getTasks(
                    u,
                    inbox.map((e) => e.getBody())
                );
                const tree = buildTaskTree(u.getTasks());
                setTaskTree(tree);
                initializeExpandedNodes(tree);
            } catch (e) {
                console.error(e);
                setTaskTree(null);
                setExpandedNodes(new Set());
            }
        };

        if (useMockData) {
            loadTasksFromMock();
            return;
        }

        if (!accessToken) {
            setTaskTree(null);
            setExpandedNodes(new Set());
            return;
        }

        loadTasksFromGraph(accessToken);
    }, [accessToken, useMockData]);

    const root = taskTree ? taskTree.getRoot() : null;
    // check if we have tasks
    const hasTasks = !!root;
    const rootChildren = root ? root.getChildren() : [];

    return (
        <>
            {/* Redirect to home if not set up properly */}
            {!accessToken && !useMockData ? (
                <Navigate to="/" replace />
            ) : (
                <div style={{ display: "flex", height: "100vh" }}>
                    <div
                        style={{
                            width: "250px",
                            backgroundColor: "#f5f5f5",
                            padding: "20px",
                            borderRight: "1px solid #ddd",
                        }}
                    >
                        <h2>Mail Dashboard</h2>
                        {/* Sidebar navigation*/}
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: "10px" }}>
                                <Link to="/inbox" style={{ textDecoration: "none", color: "#555" }}>
                                    Inbox
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link to="/sent" style={{ textDecoration: "none", color: "#555" }}>
                                    Sent Emails
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link
                                    to="/Tasks"
                                    style={{ textDecoration: "none", color: "#1a73e8" }}
                                >
                                    Tasks
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link
                                    to="/backup"
                                    style={{ textDecoration: "none", color: "#555" }}
                                >
                                    Backup
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                        <h2>Tasks</h2>

                        {!hasTasks && (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <p>No tasks found.</p>
                            </div>
                        )}

                        {hasTasks && root && (
                            <div>{rootChildren.map((child) => renderTaskNode(child, 0))}</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Tasks;
