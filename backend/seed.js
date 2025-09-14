const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('./models/User');
const Committee = require('./models/Committee');
const Event = require('./models/Event');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Committee.deleteMany({});
    await Event.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@festivo.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        collegeId: 'ADMIN001',
        year: '2024'
      },
      {
        name: 'John Doe',
        email: 'john@student.com',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'student',
        collegeId: 'STU001',
        year: '2024'
      },
      {
        name: 'Jane Smith',
        email: 'jane@student.com',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'student',
        collegeId: 'STU002',
        year: '2023'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@student.com',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'student',
        collegeId: 'STU003',
        year: '2024'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@student.com',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'student',
        collegeId: 'STU004',
        year: '2023'
      },
      {
        name: 'David Brown',
        email: 'david@student.com',
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'student',
        collegeId: 'STU005',
        year: '2024'
      },
      {
        name: 'Committee Head',
        email: 'committee@festivo.com',
        passwordHash: await bcrypt.hash('committee123', 10),
        role: 'committee',
        collegeId: 'COM001',
        year: '2024'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Create committee
    const committee = new Committee({
      name: 'Tech Committee',
      memberIds: [createdUsers[6]._id], // Committee Head
      description: 'Handles all technical events and competitions'
    });

    await committee.save();
    console.log('Created committee:', committee.name);

    // Create events
    const events = [
      {
        title: 'Coding Competition',
        description: 'A competitive programming contest with multiple rounds. Participants will solve algorithmic problems using their preferred programming language.',
        committeeId: committee._id,
        dateTime: new Date('2024-03-15T10:00:00Z'),
        venue: 'Computer Lab 1',
        fee: 50,
        packages: [
          {
            name: 'Student Package',
            price: 30,
            description: 'Discounted rate for students',
            isStudentDiscount: true
          },
          {
            name: 'Group Package (3+ members)',
            price: 120,
            description: 'Bulk discount for groups',
            isBulkPackage: true
          }
        ],
        isGroup: true,
        maxGroupSize: 3,
        rules: [
          'Participants must bring their own laptops',
          'Internet access will be provided',
          'No external help allowed during the competition',
          'Time limit: 3 hours'
        ]
      },
      {
        title: 'Hackathon',
        description: 'A 24-hour hackathon where teams build innovative solutions to real-world problems. Prizes for top 3 teams.',
        committeeId: committee._id,
        dateTime: new Date('2024-03-20T09:00:00Z'),
        venue: 'Main Auditorium',
        fee: 100,
        packages: [
          {
            name: 'Student Package',
            price: 60,
            description: 'Discounted rate for students',
            isStudentDiscount: true
          },
          {
            name: 'Group Package (4+ members)',
            price: 200,
            description: 'Bulk discount for groups',
            isBulkPackage: true
          }
        ],
        isGroup: true,
        maxGroupSize: 5,
        rules: [
          'Teams must consist of 2-5 members',
          'All code must be written during the hackathon',
          'Internet access will be provided',
          'Meals and refreshments included'
        ]
      },
      {
        title: 'Tech Quiz',
        description: 'A technical quiz competition covering various topics in computer science, programming, and technology.',
        committeeId: committee._id,
        dateTime: new Date('2024-03-25T14:00:00Z'),
        venue: 'Seminar Hall',
        fee: 25,
        packages: [
          {
            name: 'Student Package',
            price: 15,
            description: 'Discounted rate for students',
            isStudentDiscount: true
          }
        ],
        isGroup: false,
        maxGroupSize: 1,
        rules: [
          'Individual participation only',
          'No electronic devices allowed',
          'Quiz will have 50 questions',
          'Time limit: 1 hour'
        ]
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log('Created events:', createdEvents.length);

    // Update committee with assigned events
    committee.assignedEventIds = createdEvents.map(event => event._id);
    await committee.save();

    console.log('Seeding completed successfully!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@festivo.com / admin123');
    console.log('Committee: committee@festivo.com / committee123');
    console.log('Students: john@student.com, jane@student.com, mike@student.com, sarah@student.com, david@student.com / student123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding
seedData();

