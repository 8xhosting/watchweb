/**
 * Withdrawal ticker data generator (client-side only, decorative).
 * Pure TypeScript — no imports; Math.random is fine here.
 */

/** Common Indian first names, mixed male/female (100 distinct). */
export const FIRST_NAMES: string[] = [
  // male
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Kabir', 'Advait', 'Arnav', 'Dhruv', 'Aryan', 'Kartik',
  'Nikhil', 'Rahul', 'Vikram', 'Amit', 'Rajesh', 'Suresh', 'Manish', 'Ravi',
  'Karan', 'Siddharth', 'Harsh', 'Yash', 'Dev', 'Akash', 'Rohit', 'Mohit',
  'Varun', 'Adarsh', 'Pranav', 'Abhishek', 'Vivek', 'Ankur', 'Gaurav',
  'Saurabh', 'Deepak', 'Pankaj', 'Sunil', 'Anil', 'Ashok', 'Vinod', 'Sanjay',
  'Vijay', 'Ajay', 'Alok',
  // female
  'Anaya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Anika', 'Navya', 'Myra',
  'Riya', 'Priya', 'Ananya', 'Ishita', 'Kavya', 'Meera', 'Sneha', 'Pooja',
  'Neha', 'Divya', 'Aarohi', 'Ira', 'Kiara', 'Anjali', 'Swati', 'Nisha',
  'Preeti', 'Shreya', 'Simran', 'Kritika', 'Tanvi', 'Radhika', 'Nandini',
  'Bhavya', 'Prisha', 'Vanya', 'Avni', 'Charvi', 'Sanya', 'Trisha', 'Rhea',
  'Zoya', 'Suhana', 'Ayesha', 'Sana', 'Lakshmi', 'Gayatri', 'Revathi',
  'Kirti', 'Mansi', 'Jhanvi', 'Shanaya',
]

/** Common Indian surnames (45 distinct). */
export const LAST_NAMES: string[] = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Das', 'Rao',
  'Reddy', 'Nair', 'Menon', 'Iyer', 'Mehta', 'Shah', 'Joshi', 'Desai',
  'Kapoor', 'Malhotra', 'Chopra', 'Bhatt', 'Pandey', 'Mishra', 'Tiwari',
  'Yadav', 'Chauhan', 'Rathore', 'Bose', 'Sen', 'Ghosh', 'Mukherjee',
  'Banerjee', 'Chatterjee', 'Pillai', 'Kulkarni', 'Deshmukh', 'Naik',
  'Shetty', 'Hegde', 'Saxena', 'Srivastava', 'Trivedi', 'Bhatia', 'Kohli',
  'Agarwal', 'Jain',
]

export interface WithdrawalEntry {
  id: number
  name: string
  amount: number
}

/**
 * Build `count` withdrawal entries with UNIQUE display names
 * (first + " " + last) and a random amount between ₹1,500 and ₹44,999.
 * Uniqueness is guaranteed by retrying on already-used pairs
 * (100 × 45 = 4500 combos, so retries terminate quickly).
 */
export function buildWithdrawals(count = 220): WithdrawalEntry[] {
  const used = new Set<string>()
  const entries: WithdrawalEntry[] = []
  for (let i = 0; i < count; i++) {
    let name = ''
    do {
      name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${
        LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
      }`
    } while (used.has(name))
    used.add(name)
    entries.push({
      id: i,
      name,
      amount: 1500 + Math.floor(Math.random() * 43500),
    })
  }
  return entries
}
