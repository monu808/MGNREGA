export const translations = {
  en: {
    title: 'MGNREGA District Performance',
    subtitle: 'Our Voice, Our Rights',
    selectDistrict: 'Select Your District',
    autoDetect: 'Auto-detect my location',
    or: 'OR',
    searchDistrict: 'Search district...',
    loading: 'Loading...',
    error: 'Error loading data',
    noData: 'No data available',
    
    // Performance indicators
    overall: 'Overall Performance',
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    needsImprovement: 'Needs Improvement',
    
    // Metrics
    jobCards: 'Job Cards',
    workers: 'Workers',
    workDays: 'Work Days',
    wages: 'Wages Paid',
    works: 'Works',
    
    // Details
    totalJobCards: 'Total Job Cards',
    activeWorkers: 'Active Workers',
    womenWorkers: 'Women Workers',
    personDaysGenerated: 'Person Days Generated',
    avgDaysPerHousehold: 'Avg Days per Household',
    avgWagePerDay: 'Avg Wage per Day',
    totalExpenditure: 'Total Expenditure',
    ongoingWorks: 'Ongoing Works',
    completedWorks: 'Completed Works',
    
    // History
    performanceHistory: 'Performance History',
    viewHistory: 'View History',
    compareDistricts: 'Compare with Other Districts',
    
    // Explanations (simple language)
    jobCardsExplain: 'Number of families registered for work',
    workersExplain: 'Number of people who got work',
    workDaysExplain: 'Total days of work provided',
    wagesExplain: 'Money paid to workers',
    worksExplain: 'Projects like roads, ponds being built',
  },
  
  hi: {
    title: 'मनरेगा जिला प्रदर्शन',
    subtitle: 'हमारी आवाज़, हमारे अधिकार',
    selectDistrict: 'अपना जिला चुनें',
    autoDetect: 'मेरा स्थान स्वचालित खोजें',
    or: 'या',
    searchDistrict: 'जिला खोजें...',
    loading: 'लोड हो रहा है...',
    error: 'डेटा लोड करने में त्रुटि',
    noData: 'कोई डेटा उपलब्ध नहीं',
    
    // Performance indicators
    overall: 'समग्र प्रदर्शन',
    excellent: 'उत्कृष्ट',
    good: 'अच्छा',
    average: 'औसत',
    needsImprovement: 'सुधार की आवश्यकता',
    
    // Metrics
    jobCards: 'जॉब कार्ड',
    workers: 'कामगार',
    workDays: 'काम के दिन',
    wages: 'मजदूरी भुगतान',
    works: 'कार्य',
    
    // Details
    totalJobCards: 'कुल जॉब कार्ड',
    activeWorkers: 'सक्रिय कामगार',
    womenWorkers: 'महिला कामगार',
    personDaysGenerated: 'व्यक्ति दिवस उत्पन्न',
    avgDaysPerHousehold: 'प्रति परिवार औसत दिन',
    avgWagePerDay: 'प्रति दिन औसत मजदूरी',
    totalExpenditure: 'कुल व्यय',
    ongoingWorks: 'चल रहे कार्य',
    completedWorks: 'पूर्ण कार्य',
    
    // History
    performanceHistory: 'प्रदर्शन इतिहास',
    viewHistory: 'इतिहास देखें',
    compareDistricts: 'अन्य जिलों से तुलना करें',
    
    // Explanations (simple language)
    jobCardsExplain: 'काम के लिए पंजीकृत परिवारों की संख्या',
    workersExplain: 'जिन लोगों को काम मिला',
    workDaysExplain: 'प्रदान किए गए काम के कुल दिन',
    wagesExplain: 'कामगारों को दिया गया पैसा',
    worksExplain: 'सड़कें, तालाब जैसी परियोजनाएं बन रही हैं',
  },
};

export const getTranslation = (lang, key) => {
  return translations[lang]?.[key] || translations.en[key] || key;
};
