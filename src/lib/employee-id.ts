import StylistCounter from "@/models/StylistCounter";

const EMPLOYEE_ID_PREFIX = "SV-";
const EMPLOYEE_ID_PAD = 6;

export function formatEmployeeId(seq: number): string {
  return `${EMPLOYEE_ID_PREFIX}${String(seq).padStart(EMPLOYEE_ID_PAD, "0")}`;
}

export async function nextEmployeeId(): Promise<string> {
  const counter = await StylistCounter.findOneAndUpdate(
    { _id: "employeeId" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return formatEmployeeId(counter.seq);
}
