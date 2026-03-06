// A task node to form a task tree and create the task list which is based on users received emails
class TaskNode {
    // Variables
    private description: string;
    private children: TaskNode[];
    private parent: TaskNode | null;

    constructor(description: string) {
        const des = description.trim();
        if (!des) {
            throw new Error("Description is empty");
        }
        this.description = des;
        this.children = [];
        this.parent = null;
    }

    public getDescription(): string {
        return this.description;
    }

    public getChildren(): TaskNode[] {
        // return copy of children
        return [...this.children];
    }

    public getParent(): TaskNode | null {
        return this.parent;
    }
    // add child node with error checking
    public addChild(child: TaskNode): void {
        if (child === this) {
            throw new Error("A node cannot be a child of itself");
        }
        if (this.containsNode(child)) {
            throw new Error("Duplicate child node");
        }
        if (child.containsNode(this)) {
            throw new Error("Cannot have Circular tree reference");
        }
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    public removeChild(child: TaskNode): boolean {
        const index = this.children.indexOf(child);
        if (index === -1) {
            return false;
        }
        this.children.splice(index, 1);
        child.parent = null;
        return true;
    }

    public containsNode(node: TaskNode): boolean {
        if (this === node) {
            return true;
        }
        for (const child of this.children) {
            if (child.containsNode(node)) {
                return true;
            }
        }
        return false;
    }
}

export default TaskNode;
