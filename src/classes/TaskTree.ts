import TaskNode from "./TaskNode";
// A class for creating a tree of tasks, tasknodes, and consists of all functions to manipulate the tree and its nodes like adding, removing, transversing and finding nodes.
class TaskTree {
    private root: TaskNode | null;
    private nodeCount: number;
    private readonly maxSize: number;

    // Starts with an empty tree and default maxSize of 500 if its not set
    constructor(rootDescription?: string, maxSize = 500) {
        this.maxSize = maxSize;
        this.root = null;
        this.nodeCount = 0;
        if (rootDescription && rootDescription.trim()) {
            this.root = new TaskNode(rootDescription);
            this.nodeCount = 1;
        }
    }
    // If the root is empty that means the tree is empty
    public isEmpty(): boolean {
        return this.root === null;
    }

    public getRoot(): TaskNode | null {
        return this.root;
    }
    // Ensure that the root is only set once and the description isn't empty
    public setRoot(description: string): void {
        const des = description.trim();
        if (!des) {
            throw new Error("Description is empty");
        }
        if (this.root !== null) {
            throw new Error("Root already exists");
        }
        this.root = new TaskNode(des);
        this.nodeCount = 1;
    }
    // Check if a node exists
    public contains(description: string): boolean {
        return this.findTask(description) !== null;
    }
    // Find a node in the tree based on description or null if doesnt exist
    public findTask(description: string): TaskNode | null {
        const des = description.trim();
        if (!des || this.root === null) {
            return null;
        }
        // BFS to find the node with the description, trimming the description and checking if not empty and then traversal
        // Use a queue for BFS traversal
        const queue: TaskNode[] = [this.root];
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                continue;
            }
            if (current.getDescription() === des) {
                return current;
            }
            queue.push(...current.getChildren());
        }
        return null;
    }
    // Add a task to the tree by finding the parent and then adding the new task as a child
    public addTask(parentDescription: string, taskDescription: string): void {
        const normalizedParent = parentDescription.trim();
        const normalizedTask = taskDescription.trim();

        if (!normalizedTask) {
            throw new Error("Description is empty");
        }
        if (this.nodeCount >= this.maxSize) {
            throw new Error("Maximum size Reached");
        }

        if (this.root === null) {
            if (normalizedParent) {
                throw new Error("Create a root first");
            }
            this.root = new TaskNode(normalizedTask);
            this.nodeCount = 1;
            return;
        }

        if (this.contains(normalizedTask)) {
            throw new Error("Duplicate task descriptions are not allowed");
        }

        const parent = this.findTask(normalizedParent);
        if (!parent) {
            throw new Error(`Parent task not found: ${normalizedParent}`);
        }

        parent.addChild(new TaskNode(normalizedTask));
        this.nodeCount += 1;
    }
    // Remove a task by finding the node and then removing it from its parent, also removing all of its children and updating the node count
    public removeTask(taskDescription: string): boolean {
        const normalizedTask = taskDescription.trim();
        if (!normalizedTask) {
            throw new Error("Description is empty");
        }
        if (this.root === null) {
            throw new Error("Cannot remove from an empty tree");
        }

        const nodeToRemove = this.findTask(normalizedTask);
        if (!nodeToRemove) {
            return false;
        }

        const removedSize = this.countSubtreeNodes(nodeToRemove);
        const parent = nodeToRemove.getParent();

        if (!parent) {
            this.root = null;
            this.nodeCount = 0;
            return true;
        }
        // Remove the subtree
        const removed = parent.removeChild(nodeToRemove);
        if (removed) {
            this.nodeCount -= removedSize;
        }
        return removed;
    }
    // Traverse the tree in pre-order (Parent - Child - Grand Child) and return an array of nodes in that order
    public traversePreOrder(): TaskNode[] {
        if (this.root === null) {
            return [];
        }
        const output: TaskNode[] = [];
        // Recursively Traverse the Tree
        this.walkPreOrder(this.root, output);
        return output;
    }
    // Create a tree from an array of indented lines by using get relationships and use a stack for parent nodes
    public static fromTaskLines(lines: string[]): TaskTree {
        const tree = new TaskTree();
        const stack: Array<{ depth: number; node: TaskNode }> = [];
        // For each line, get its depth by using leading spaces, then find its parent based on the stack and add it as a child to the parent
        for (const rawLine of lines) {
            if (!rawLine || !rawLine.trim()) {
                continue;
            }
            const depth = this.getDepth(rawLine);
            // Removes special characters
            const parsedDescription = this.cleanTaskLine(rawLine);
            if (!parsedDescription) {
                continue;
            }
            // Make descriptions unique with nums if needed
            const uniqueDescription = this.makeUniqueDescription(tree, parsedDescription);

            if (tree.isEmpty()) {
                tree.setRoot(uniqueDescription);
                const rootNode = tree.getRoot();
                if (rootNode) {
                    stack.push({ depth, node: rootNode });
                }
                continue;
            }
            // Pop from the stack until we find the correct parent using depth
            while (stack.length > 0 && depth <= stack[stack.length - 1].depth) {
                stack.pop();
            }

            const parentNode = stack.length > 0 ? stack[stack.length - 1].node : tree.getRoot();
            if (!parentNode) {
                continue;
            }

            tree.addTask(parentNode.getDescription(), uniqueDescription);
            const addedNode = tree.findTask(uniqueDescription);
            if (addedNode) {
                stack.push({ depth, node: addedNode });
            }
        }

        return tree;
    }
    // Check for duplicate descriptions and make them unique by adding nums
    private static makeUniqueDescription(tree: TaskTree, description: string): string {
        if (!tree.contains(description)) {
            return description;
        }
        let counter = 2;
        let candidate = `${description} (${counter})`;
        while (tree.contains(candidate)) {
            counter += 1;
            candidate = `${description} (${counter})`;
        }
        return candidate;
    }
    // Gets the depth using the number of leading spaces as part of the expected response
    private static getDepth(taskLine: string): number {
        const tabToSpaces = taskLine.replace(/\t/g, "  ");
        const leadingSpaces = tabToSpaces.length - tabToSpaces.trimStart().length;
        return Math.floor(leadingSpaces / 2);
    }
    // Remove all special characters
    private static cleanTaskLine(taskLine: string): string {
        return taskLine
            .trim()
            .replace(/^[-*]\s+/, "")
            .replace(/^\d+(\.\d+)*[.)]?\s+/, "")
            .trim();
    }
    // Recursive, count number of descendants in the subtree including itself
    private countSubtreeNodes(node: TaskNode): number {
        let total = 1;
        for (const child of node.getChildren()) {
            total += this.countSubtreeNodes(child);
        }
        return total;
    }
    // Recursive traversal to be used for the preorder traversal, adding node and its children
    private walkPreOrder(node: TaskNode, output: TaskNode[]): void {
        output.push(node);
        for (const child of node.getChildren()) {
            this.walkPreOrder(child, output);
        }
    }
}

export default TaskTree;
