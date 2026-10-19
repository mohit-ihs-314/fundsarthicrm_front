export interface LoanApplication {
  id: string;
  userId: string;
  userName: string;
  mobile: string;
  email: string;
  loanAmount: number;
  loanType: string;
  status: "new" | "in-process" | "approved" | "rejected";
  appliedDate: string;
  city: string;
  employment: string;
  income: number;
  purpose: string;
  progress: number;
  propertyValue?: number;
  tenure?: number;
  notes?: string;
  currentStep: 1 | 2 | 3 | 4; // 1: Application Submitted, 2: Document Verification, 3: Bank Processing, 4: Approval
  isRejected?: boolean; // Track if loan was rejected at any step
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  employment: string;
  income: number;
  totalLoans: number;
  approvedLoans: number;
  joinedDate: string;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  mobile: string;
  experience: string;
  expertise: string[];
  languages: string[];
  rating: number;
  totalConsultations: number;
  status: "active" | "inactive" | "pending";
  photo?: string;
}

export interface Booking {
  id: string;
  consultantId: string;
  consultantName: string;
  customerName: string;
  customerMobile: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  type: string;
  status: "pending" | "approved" | "rejected";
  image?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  listedDate: string;
}

export const mockLoanApplications: LoanApplication[] = [
  {
    id: "LA-2024-001",
    userId: "U001",
    userName: "Rajesh Kumar",
    mobile: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    loanAmount: 2500000,
    loanType: "Home Loan",
    status: "new",
    appliedDate: "2024-04-02",
    city: "Mumbai",
    employment: "Salaried",
    income: 85000,
    purpose: "Purchase residential property",
    progress: 25,
    propertyValue: 3500000,
    tenure: 20,
    currentStep: 1, // Just submitted
  },
  {
    id: "LA-2024-002",
    userId: "U002",
    userName: "Priya Sharma",
    mobile: "+91 98765 43211",
    email: "priya.sharma@email.com",
    loanAmount: 500000,
    loanType: "Personal Loan",
    status: "in-process",
    appliedDate: "2024-04-01",
    city: "Delhi",
    employment: "Self-Employed",
    income: 120000,
    purpose: "Business expansion",
    progress: 50,
    tenure: 5,
    notes: "Customer has excellent credit history",
    currentStep: 2, // Document Verification
  },
  {
    id: "LA-2024-003",
    userId: "U003",
    userName: "Amit Patel",
    mobile: "+91 98765 43212",
    email: "amit.patel@email.com",
    loanAmount: 1800000,
    loanType: "Car Loan",
    status: "approved",
    appliedDate: "2024-03-28",
    city: "Bangalore",
    employment: "Salaried",
    income: 95000,
    purpose: "Purchase luxury vehicle",
    progress: 100,
    tenure: 7,
    currentStep: 4, // Approved
  },
  {
    id: "LA-2024-004",
    userId: "U004",
    userName: "Sneha Reddy",
    mobile: "+91 98765 43213",
    email: "sneha.reddy@email.com",
    loanAmount: 750000,
    loanType: "Education Loan",
    status: "rejected",
    appliedDate: "2024-03-25",
    city: "Hyderabad",
    employment: "Student",
    income: 0,
    purpose: "Masters degree abroad",
    progress: 0,
    tenure: 10,
    notes: "Insufficient guarantor documents",
    currentStep: 2, // Rejected at Document Verification
    isRejected: true,
  },
  {
    id: "LA-2024-005",
    userId: "U005",
    userName: "Vikram Singh",
    mobile: "+91 98765 43214",
    email: "vikram.singh@email.com",
    loanAmount: 3500000,
    loanType: "Home Loan",
    status: "in-process",
    appliedDate: "2024-04-03",
    city: "Pune",
    employment: "Salaried",
    income: 150000,
    purpose: "Purchase apartment",
    progress: 75,
    propertyValue: 5000000,
    tenure: 25,
    currentStep: 3, // Bank Processing
  },
  {
    id: "LA-2024-006",
    userId: "U006",
    userName: "Ananya Iyer",
    mobile: "+91 98765 43215",
    email: "ananya.iyer@email.com",
    loanAmount: 300000,
    loanType: "Personal Loan",
    status: "new",
    appliedDate: "2024-04-04",
    city: "Chennai",
    employment: "Salaried",
    income: 65000,
    purpose: "Wedding expenses",
    progress: 25,
    tenure: 3,
    currentStep: 1, // Just submitted
  },
];

export const mockUsers: User[] = [
  {
    id: "U001",
    name: "Rajesh Kumar",
    mobile: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    city: "Mumbai",
    employment: "Salaried",
    income: 85000,
    totalLoans: 3,
    approvedLoans: 2,
    joinedDate: "2023-06-15",
  },
  {
    id: "U002",
    name: "Priya Sharma",
    mobile: "+91 98765 43211",
    email: "priya.sharma@email.com",
    city: "Delhi",
    employment: "Self-Employed",
    income: 120000,
    totalLoans: 5,
    approvedLoans: 4,
    joinedDate: "2023-03-20",
  },
  {
    id: "U003",
    name: "Amit Patel",
    mobile: "+91 98765 43212",
    email: "amit.patel@email.com",
    city: "Bangalore",
    employment: "Salaried",
    income: 95000,
    totalLoans: 2,
    approvedLoans: 2,
    joinedDate: "2023-09-10",
  },
  {
    id: "U004",
    name: "Sneha Reddy",
    mobile: "+91 98765 43213",
    email: "sneha.reddy@email.com",
    city: "Hyderabad",
    employment: "Student",
    income: 0,
    totalLoans: 1,
    approvedLoans: 0,
    joinedDate: "2024-01-05",
  },
  {
    id: "U005",
    name: "Vikram Singh",
    mobile: "+91 98765 43214",
    email: "vikram.singh@email.com",
    city: "Pune",
    employment: "Salaried",
    income: 150000,
    totalLoans: 4,
    approvedLoans: 3,
    joinedDate: "2022-11-30",
  },
];

export const mockConsultants: Consultant[] = [
  {
    id: "C001",
    name: "Dr. Arun Mehta",
    email: "arun.mehta@finloan.com",
    mobile: "+91 99999 11111",
    experience: "10+ years",
    expertise: ["Home Loans", "Property Valuation", "Legal Documentation"],
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    totalConsultations: 245,
    status: "active",
  },
  {
    id: "C002",
    name: "Kavita Desai",
    email: "kavita.desai@finloan.com",
    mobile: "+91 99999 22222",
    experience: "7 years",
    expertise: ["Personal Loans", "Credit Analysis", "Financial Planning"],
    languages: ["English", "Hindi", "Marathi"],
    rating: 4.6,
    totalConsultations: 189,
    status: "active",
  },
  {
    id: "C003",
    name: "Rahul Khanna",
    email: "rahul.khanna@finloan.com",
    mobile: "+91 99999 33333",
    experience: "5 years",
    expertise: ["Business Loans", "SME Financing", "Investment Advisory"],
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.7,
    totalConsultations: 156,
    status: "active",
  },
  {
    id: "C004",
    name: "Meera Nair",
    email: "meera.nair@finloan.com",
    mobile: "+91 99999 44444",
    experience: "3 years",
    expertise: ["Education Loans", "Overseas Funding", "Documentation"],
    languages: ["English", "Hindi", "Malayalam"],
    rating: 4.5,
    totalConsultations: 87,
    status: "pending",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "B001",
    consultantId: "C001",
    consultantName: "Dr. Arun Mehta",
    customerName: "Rajesh Kumar",
    customerMobile: "+91 98765 43210",
    date: "2024-04-06",
    time: "10:00 AM",
    status: "scheduled",
    notes: "First-time home buyer consultation",
  },
  {
    id: "B002",
    consultantId: "C002",
    consultantName: "Kavita Desai",
    customerName: "Priya Sharma",
    customerMobile: "+91 98765 43211",
    date: "2024-04-05",
    time: "02:00 PM",
    status: "completed",
    notes: "Personal loan application review",
  },
  {
    id: "B003",
    consultantId: "C003",
    consultantName: "Rahul Khanna",
    customerName: "Amit Patel",
    customerMobile: "+91 98765 43212",
    date: "2024-04-07",
    time: "11:30 AM",
    status: "scheduled",
    notes: "Business expansion loan discussion",
  },
  {
    id: "B004",
    consultantId: "C001",
    consultantName: "Dr. Arun Mehta",
    customerName: "Vikram Singh",
    customerMobile: "+91 98765 43214",
    date: "2024-04-04",
    time: "03:00 PM",
    status: "completed",
  },
  {
    id: "B005",
    consultantId: "C004",
    consultantName: "Meera Nair",
    customerName: "Sneha Reddy",
    customerMobile: "+91 98765 43213",
    date: "2024-04-08",
    time: "04:00 PM",
    status: "scheduled",
    notes: "Education loan guidance",
  },
];

export const mockProperties: Property[] = [
  {
    id: "P001",
    title: "Luxury 3BHK Apartment",
    location: "Bandra West",
    city: "Mumbai",
    price: 18500000,
    type: "Apartment",
    status: "approved",
    bedrooms: 3,
    bathrooms: 3,
    area: 1450,
    listedDate: "2024-03-15",
  },
  {
    id: "P002",
    title: "Modern Villa",
    location: "Whitefield",
    city: "Bangalore",
    price: 25000000,
    type: "Villa",
    status: "pending",
    bedrooms: 4,
    bathrooms: 4,
    area: 2800,
    listedDate: "2024-04-01",
  },
  {
    id: "P003",
    title: "Cozy 2BHK Flat",
    location: "Koramangala",
    city: "Bangalore",
    price: 8500000,
    type: "Apartment",
    status: "approved",
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    listedDate: "2024-03-20",
  },
  {
    id: "P004",
    title: "Spacious Penthouse",
    location: "Golf Course Road",
    city: "Gurgaon",
    price: 45000000,
    type: "Penthouse",
    status: "pending",
    bedrooms: 5,
    bathrooms: 5,
    area: 4500,
    listedDate: "2024-04-02",
  },
  {
    id: "P005",
    title: "Budget Studio Apartment",
    location: "Kharadi",
    city: "Pune",
    price: 4500000,
    type: "Studio",
    status: "rejected",
    bedrooms: 1,
    bathrooms: 1,
    area: 550,
    listedDate: "2024-03-10",
  },
];