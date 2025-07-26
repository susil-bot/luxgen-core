const database = require('../config/database');
const Poll = require('../models/Poll');
const User = require('../models/User');
const mongoose = require('mongoose');

const sampleUsers = [
  {
    tenantId: 'tenant1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'trainer',
    department: 'Training',
    position: 'Senior Trainer'
  },
  {
    tenantId: 'tenant1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'admin',
    department: 'Management',
    position: 'Training Manager'
  },
  {
    tenantId: 'tenant1',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    role: 'user',
    department: 'Sales',
    position: 'Sales Representative'
  },
  {
    tenantId: 'tenant1',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: 'password123',
    role: 'user',
    department: 'Marketing',
    position: 'Marketing Specialist'
  }
];

const samplePolls = [
  {
    tenantId: 'tenant1',
    title: 'Leadership Training Effectiveness',
    description: 'Gather feedback on leadership training program effectiveness',
    niche: 'Leadership Development',
    targetAudience: ['Managers', 'Team Leads', 'Executives'],
    questions: [
      {
        question: 'How would you rate the overall effectiveness of the leadership training?',
        type: 'rating',
        required: true,
        order: 1
      },
      {
        question: 'Which leadership skills did you find most valuable?',
        type: 'multiple_choice',
        options: ['Communication', 'Decision Making', 'Team Building', 'Strategic Thinking'],
        required: true,
        order: 2
      },
      {
        question: 'What additional topics would you like to see covered in future training?',
        type: 'text',
        required: false,
        order: 3
      }
    ],
    channels: ['email', 'slack'],
    status: 'sent',
    priority: 'high',
    tags: ['leadership', 'training', 'feedback'],
    scheduledDate: new Date('2024-01-15'),
    sentDate: new Date('2024-01-15'),
    recipients: [
      {
        userId: null,
        email: 'john.doe@example.com',
        name: 'John Doe',
        sentAt: new Date('2024-01-15'),
        respondedAt: new Date('2024-01-16')
      },
      {
        userId: null,
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        sentAt: new Date('2024-01-15'),
        respondedAt: new Date('2024-01-17')
      }
    ],
    responses: [
      {
        userId: null,
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        answers: [
          {
            questionId: '1',
            answer: 5,
            questionText: 'How would you rate the overall effectiveness of the leadership training?'
          },
          {
            questionId: '2',
            answer: ['Communication', 'Team Building'],
            questionText: 'Which leadership skills did you find most valuable?'
          },
          {
            questionId: '3',
            answer: 'More focus on conflict resolution would be helpful.',
            questionText: 'What additional topics would you like to see covered in future training?'
          }
        ],
        completedAt: new Date('2024-01-16')
      }
    ],
    feedback: [
      {
        userId: null,
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        rating: 5,
        comment: 'Excellent training program! The practical exercises were very helpful.',
        helpful: 8
      }
    ],
    notifications: [
      {
        type: 'poll_response',
        title: 'New Response Received',
        message: 'John Doe completed the Leadership Training Effectiveness poll',
        read: false,
        recipientId: null
      },
      {
        type: 'feedback_received',
        title: 'Feedback Received',
        message: 'John Doe left feedback on Leadership Training Effectiveness poll',
        read: false,
        recipientId: null
      }
    ],
    settings: {
      allowAnonymous: false,
      requireEmail: true,
      maxResponses: null,
      autoClose: false
    },
    analytics: {
      totalRecipients: 2,
      totalResponses: 1,
      responseRate: 50,
      averageRating: 5,
      completionTime: 15
    }
  },
  {
    tenantId: 'tenant1',
    title: 'Sales Team Performance Survey',
    description: 'Assess sales team performance and identify improvement areas',
    niche: 'Sales Training',
    targetAudience: ['Sales Representatives', 'Account Managers'],
    questions: [
      {
        question: 'How confident are you in your sales techniques?',
        type: 'rating',
        required: true,
        order: 1
      },
      {
        question: 'Which sales tools do you use most frequently?',
        type: 'multiple_choice',
        options: ['CRM System', 'Email Templates', 'Social Media', 'Cold Calling Scripts'],
        required: true,
        order: 2
      },
      {
        question: 'What challenges do you face in your sales process?',
        type: 'text',
        required: false,
        order: 3
      }
    ],
    channels: ['whatsapp', 'email'],
    status: 'scheduled',
    priority: 'medium',
    tags: ['sales', 'performance', 'assessment'],
    scheduledDate: new Date('2024-01-25'),
    recipients: [
      {
        userId: null,
        email: 'mike.johnson@example.com',
        name: 'Mike Johnson',
        sentAt: null,
        respondedAt: null
      },
      {
        userId: null,
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        sentAt: null,
        respondedAt: null
      }
    ],
    responses: [],
    feedback: [],
    notifications: [
      {
        type: 'schedule_reminder',
        title: 'Poll Scheduled',
        message: 'Sales Team Performance Survey is scheduled for Jan 25, 2024',
        read: true,
        recipientId: null
      }
    ],
    settings: {
      allowAnonymous: false,
      requireEmail: true,
      maxResponses: null,
      autoClose: false
    },
    analytics: {
      totalRecipients: 2,
      totalResponses: 0,
      responseRate: 0,
      averageRating: 0,
      completionTime: 0
    }
  },
  {
    tenantId: 'tenant1',
    title: 'Technical Skills Assessment',
    description: 'Evaluate current technical skills and identify training needs',
    niche: 'Technical Skills',
    targetAudience: ['Developers', 'Engineers', 'Technical Staff'],
    questions: [
      {
        question: 'How would you rate your proficiency in JavaScript?',
        type: 'rating',
        required: true,
        order: 1
      },
      {
        question: 'Which programming languages are you most comfortable with?',
        type: 'multiple_choice',
        options: ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust'],
        required: true,
        order: 2
      },
      {
        question: 'What technical skills would you like to improve?',
        type: 'text',
        required: false,
        order: 3
      }
    ],
    channels: ['email'],
    status: 'draft',
    priority: 'low',
    tags: ['technical', 'skills', 'assessment'],
    recipients: [],
    responses: [],
    feedback: [],
    notifications: [],
    settings: {
      allowAnonymous: false,
      requireEmail: true,
      maxResponses: null,
      autoClose: false
    },
    analytics: {
      totalRecipients: 0,
      totalResponses: 0,
      responseRate: 0,
      averageRating: 0,
      completionTime: 0
    }
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await database.connect();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Poll.deleteMany({});
    
    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }
    
    // Create polls
    console.log('📊 Creating polls...');
    for (const pollData of samplePolls) {
      // Set createdBy to first trainer user
      const trainer = createdUsers.find(u => u.role === 'trainer');
      pollData.createdBy = trainer._id;
      
      // Update recipient user IDs
      pollData.recipients = pollData.recipients.map(recipient => {
        const user = createdUsers.find(u => u.email === recipient.email);
        return {
          ...recipient,
          userId: user ? user._id : null
        };
      });
      
      // Create poll without responses and feedback first
      const pollWithoutResponses = {
        ...pollData,
        responses: [],
        feedback: []
      };
      
      const poll = new Poll(pollWithoutResponses);
      await poll.save();
      
      // Add responses if they exist
      if (pollData.responses.length > 0) {
        const response = pollData.responses[0];
        const user = createdUsers.find(u => u.email === response.userEmail);
        
        if (user) {
          const answers = response.answers.map((answer, index) => ({
            questionId: poll.questions[index]._id,
            answer: answer.answer,
            questionText: answer.questionText
          }));
          
          await poll.addResponse(user._id, response.userName, response.userEmail, answers);
        }
      }
      
      // Add feedback if it exists
      if (pollData.feedback.length > 0) {
        const feedback = pollData.feedback[0];
        const user = createdUsers.find(u => u.email === feedback.userEmail);
        
        if (user) {
          await poll.addFeedback(user._id, feedback.userName, feedback.userEmail, feedback.rating, feedback.comment);
        }
      }
      
      console.log(`✅ Created poll: ${poll.title}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${createdUsers.length} users and ${samplePolls.length} polls`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData; 