import ReceivedEmail from "./classes/ReceivedEmail";
// sort emails by subject using merge sort
const compareBySubject = (left: ReceivedEmail, right: ReceivedEmail): number => {
    const leftSubj = left.getSubject().toLowerCase();
    const rightSubj = right.getSubject().toLowerCase();
    return leftSubj.localeCompare(rightSubj);
};

const mergeBySubject = (left: ReceivedEmail[], right: ReceivedEmail[]): ReceivedEmail[] => {
    const merged: ReceivedEmail[] = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (compareBySubject(left[leftIndex], right[rightIndex]) <= 0) {
            merged.push(left[leftIndex]);
            leftIndex += 1;
        } else {
            merged.push(right[rightIndex]);
            rightIndex += 1;
        }
    }

    return merged.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
};
// split in half, sort both sides, then merge back
export const mergeSortEmailsBySubject = (emails: ReceivedEmail[]): ReceivedEmail[] => {
    if (emails.length <= 1) {
        return emails;
    }

    const mid = Math.floor(emails.length / 2);
    const leftHalf = mergeSortEmailsBySubject(emails.slice(0, mid));
    const rightHalf = mergeSortEmailsBySubject(emails.slice(mid));

    return mergeBySubject(leftHalf, rightHalf);
};
