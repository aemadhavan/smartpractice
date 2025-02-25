import { db } from "../db";
import { quantTopics, quantSubtopics } from "../db/quantitative-schema";

async function seedQuantitativeData() {
  console.log("Seeding quantitative reasoning topics and subtopics...");

  try {
    // Insert main topics
    const topicsData = [
      {
        name: "Number and Operations",
        description: "Understanding numbers, their operations, and relationships."
      },
      {
        name: "Algebra",
        description: "Working with variables, expressions, and equations."
      },
      {
        name: "Measurement",
        description: "Understanding units and measuring various quantities."
      },
      {
        name: "Ratio and Proportion",
        description: "Comparing quantities and understanding proportional relationships."
      },
      {
        name: "Patterns and Sequences",
        description: "Identifying and continuing numerical and logical patterns."
      },
      {
        name: "Statistics and Probability",
        description: "Analyzing data and understanding chance."
      },
      {
        name: "Geometry",
        description: "Understanding shapes, sizes, and spatial relationships."
      },
      {
        name: "Combinatorics",
        description: "Counting techniques for different arrangements and selections."
      },
      {
        name: "Logic and Problem-Solving",
        description: "Applying logical reasoning to solve complex problems."
      }
    ];

    const insertedTopics = await db.insert(quantTopics).values(topicsData).returning({
      id: quantTopics.id,
      name: quantTopics.name
    });

    console.log("Inserted topics:", insertedTopics);

    // Map for looking up topic IDs by name - with proper TypeScript type
    const topicMap: Record<string, number> = {};
    insertedTopics.forEach(topic => {
      topicMap[topic.name] = topic.id;
    });

    // Define subtopics with their parent topic
    const subtopicsData = [
      // Number and Operations subtopics
      {
        topicId: topicMap["Number and Operations"],
        name: "Basic arithmetic",
        description: "Addition, subtraction, multiplication, and division operations."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Percentages",
        description: "Converting between percentages, decimals, and fractions; calculating percentage changes."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Discounts",
        description: "Calculating sale prices and discount amounts."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Commissions",
        description: "Calculating commission-based earnings and percentages."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Interest",
        description: "Simple and compound interest calculations."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Fractions",
        description: "Operations with fractions and mixed numbers."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Exponents",
        description: "Laws of exponents and power operations."
      },
      {
        topicId: topicMap["Number and Operations"],
        name: "Ratio",
        description: "Comparing quantities using division."
      },

      // Algebra subtopics
      {
        topicId: topicMap["Algebra"],
        name: "Equations",
        description: "Solving linear, quadratic, and other equations."
      },
      {
        topicId: topicMap["Algebra"],
        name: "Variables",
        description: "Working with unknown quantities in expressions."
      },
      {
        topicId: topicMap["Algebra"],
        name: "Exponents",
        description: "Algebraic manipulations involving powers."
      },
      {
        topicId: topicMap["Algebra"],
        name: "Relationships",
        description: "Functions, relations, and mappings between quantities."
      },

      // Measurement subtopics
      {
        topicId: topicMap["Measurement"],
        name: "Time",
        description: "Converting and calculating with time units."
      },
      {
        topicId: topicMap["Measurement"],
        name: "Distance",
        description: "Measuring and converting length units."
      },
      {
        topicId: topicMap["Measurement"],
        name: "Speed",
        description: "Calculating rates of motion and conversions."
      },
      {
        topicId: topicMap["Measurement"],
        name: "Unit conversion",
        description: "Converting between different measurement systems."
      },
      {
        topicId: topicMap["Measurement"],
        name: "Area/volume",
        description: "Calculating area and volume of various shapes."
      },

      // Ratio and Proportion subtopics
      {
        topicId: topicMap["Ratio and Proportion"],
        name: "Ratios",
        description: "Expressing relationships between quantities."
      },
      {
        topicId: topicMap["Ratio and Proportion"],
        name: "Scaling",
        description: "Resizing shapes while maintaining proportions."
      },
      {
        topicId: topicMap["Ratio and Proportion"],
        name: "Proportional relationships",
        description: "Direct and inverse proportions."
      },

      // Patterns and Sequences subtopics
      {
        topicId: topicMap["Patterns and Sequences"],
        name: "Number patterns",
        description: "Identifying and extending numerical sequences."
      },
      {
        topicId: topicMap["Patterns and Sequences"],
        name: "Rules",
        description: "Formulating rules to describe patterns."
      },
      {
        topicId: topicMap["Patterns and Sequences"],
        name: "Logical sequences in grids or series",
        description: "Identifying patterns in multidimensional arrangements."
      },

      // Statistics and Probability subtopics
      {
        topicId: topicMap["Statistics and Probability"],
        name: "Percentages",
        description: "Using percentages to describe statistical data."
      },
      {
        topicId: topicMap["Statistics and Probability"],
        name: "Means",
        description: "Calculating arithmetic, geometric, and weighted means."
      },
      {
        topicId: topicMap["Statistics and Probability"],
        name: "Medians",
        description: "Finding the middle value in a dataset."
      },
      {
        topicId: topicMap["Statistics and Probability"],
        name: "Data interpretation",
        description: "Analyzing and drawing conclusions from data."
      },
      {
        topicId: topicMap["Statistics and Probability"],
        name: "Probability",
        description: "Calculating the likelihood of events."
      },

      // Geometry subtopics
      {
        topicId: topicMap["Geometry"],
        name: "Area",
        description: "Calculating surface area of 2D shapes."
      },
      {
        topicId: topicMap["Geometry"],
        name: "Volume",
        description: "Calculating volume of 3D objects."
      },
      {
        topicId: topicMap["Geometry"],
        name: "Shapes",
        description: "Properties of geometric figures."
      },
      {
        topicId: topicMap["Geometry"],
        name: "Perimeter",
        description: "Calculating the boundary length of shapes."
      },

      // Combinatorics subtopics
      {
        topicId: topicMap["Combinatorics"],
        name: "Counting combinations",
        description: "Calculating possible groupings without regard to order."
      },
      {
        topicId: topicMap["Combinatorics"],
        name: "Arrangements",
        description: "Calculating possible orderings and permutations."
      },

      // Logic and Problem-Solving subtopics
      {
        topicId: topicMap["Logic and Problem-Solving"],
        name: "Multi-step reasoning",
        description: "Solving problems requiring sequential logical steps."
      },
      {
        topicId: topicMap["Logic and Problem-Solving"],
        name: "Constraints",
        description: "Problems with specific limitations and conditions."
      }
    ];

    const insertedSubtopics = await db.insert(quantSubtopics).values(subtopicsData).returning({
      id: quantSubtopics.id,
      name: quantSubtopics.name,
      topicId: quantSubtopics.topicId
    });

    console.log(`Inserted ${insertedSubtopics.length} subtopics successfully`);
    return { success: true, topicsCount: insertedTopics.length, subtopicsCount: insertedSubtopics.length };
    
  } catch (error: unknown) {
    console.error("Error seeding quantitative data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Execute the seeding function
seedQuantitativeData()
  .then((result) => {
    console.log("Seeding completed:", result);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });