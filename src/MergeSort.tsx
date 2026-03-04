import ReceivedEmail from "./classes/ReceivedEmail";
// Merge sort to sort emails by subject
const compareBySubject = (left: ReceivedEmail, right: ReceivedEmail): number =>
    left.getSubject().toLowerCase().localeCompare(right.getSubject().toLowerCase());

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
// Find the mdiddle and recursively sort the left and right halves and then merge them together
export const mergeSortEmailsBySubject = (emails: ReceivedEmail[]): ReceivedEmail[] => {
    if (emails.length <= 1) {
        return emails;
    }

    const mid = Math.floor(emails.length / 2);
    const leftHalf = mergeSortEmailsBySubject(emails.slice(0, mid));
    const rightHalf = mergeSortEmailsBySubject(emails.slice(mid));

    return mergeBySubject(leftHalf, rightHalf);
};
