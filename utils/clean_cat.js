// function to clean the category 
// takes category as input and returns the cleaned category

function cleanCategory(category) {
  const categoryMap = {
    accessories: ["accessories"],
    printer: ["printer"],
    laptop: ["laptop", "tablet"],
    others: ["&", "and"],
    printer: ["printer", "toner & cartridge", "ink", "ribbon", "binding"],
  };

  const lowercaseCategory = category.toLowerCase();
  
  for (const [cleanedCategory, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowercaseCategory.includes(keyword))) {
      return cleanedCategory;
    }
  }

  return category;
}

function cleanSubcategory(subcategory) {
  // clean the subcategory
}
