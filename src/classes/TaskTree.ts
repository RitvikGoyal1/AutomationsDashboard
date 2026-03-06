import TaskNode from "./TaskNode";
// tree structure for tasks and subtasks
class TaskTree {
    private root: TaskNode | null;
    private nodeCount: number;
    private readonly maxSize: number;

    // start with empty tree, default max is 500
    constructor(rootDescription?: string, maxSize = 500) {
        this.maxSize = maxSize;
        this.root = null;
        this.nodeCount = 0;
        if (rootDescription && rootDescription.trim()) {
            this.root = new TaskNode(rootDescription);
            this.nodeCount = 1;
        }
    }
    // check if tree empty
    public isEmpty(): boolean {
        return this.root === null;
    }

    public getRoot(): TaskNode | null {
        return this.root;
    }
    // set root node (only once)
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
    // does node exist in tree
    public contains(description: string): boolean {
        return this.findTask(description) !== null;
    }
    // find node by description, returns null if not found
    public findTask(description: string): TaskNode | null {
        const des = description.trim();
        if (!des || this.root === null) {
            return null;
        }
        // use BFS to search
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
    // add new task under a parent task
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
    // remove task and all its children
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
    // go through tree in pre-order
    public traversePreOrder(): TaskNode[] {
        if (this.root === null) {
            return [];
        }
        const output: TaskNode[] = [];
        // recursive traversal
        this.walkPreOrder(this.root, output);
        return output;
    }
    // build tree from indented text lines
    public static fromTaskLines(lines: string[]): TaskTree {
        const tree = new TaskTree();
        const stack: Array<{ depth: number; node: TaskNode }> = [];
        // process each line and find its parent based on indent
        for (const rawLine of lines) {
            if (!rawLine || !rawLine.trim()) {
                continue;
            }
            const depth = this.getDepth(rawLine);
            // clean up the line
            const parsedDescription = this.cleanTaskLine(rawLine);
            if (!parsedDescription) {
                continue;
            }
            // make sure description is unique
            const uniqueDescription = this.makeUniqueDescription(tree, parsedDescription);

            if (tree.isEmpty()) {
                tree.setRoot(uniqueDescription);
                const rootNode = tree.getRoot();
                if (rootNode) {
                    stack.push({ depth, node: rootNode });
                }
                continue;
            }
            // find parent by popping stack till we get right depth
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
    // add numbers to duplicate descriptions
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
    // get depth from leading spaces
    private static getDepth(taskLine: string): number {
        const tabToSpaces = taskLine.replace(/\t/g, "  ");
        const leadingSpaces = tabToSpaces.length - tabToSpaces.trimStart().length;
        return Math.floor(leadingSpaces / 2);
    }
    // remove bullets and numbers from start of line
    private static cleanTaskLine(taskLine: string): string {
        let line = taskLine.trim();
        // remove bullet points
        line = line.replace(/^[-*]\s+/, "");
        // remove numbers like "1." or "2)"
        line = line.replace(/^\d+[.)]\s+/, "");
        return line.trim();
    }
    // count nodes in subtree
    private countSubtreeNodes(node: TaskNode): number {
        let total = 1;
        for (const child of node.getChildren()) {
            total += this.countSubtreeNodes(child);
        }
        return total;
    }
    // recursive helper for preorder
    private walkPreOrder(node: TaskNode, output: TaskNode[]): void {
        output.push(node);
        for (const child of node.getChildren()) {
            this.walkPreOrder(child, output);
        }
    }
}

export default TaskTree;
