import { Box, Typography, ListItemText, Paper, CardContent } from '@mui/material';

const BlogContent = () => {
  return (
    <Box width={{ xs: '100%', md: '70%' }}>
      {/* Main Heading */}
      <Typography variant="h4" component="h2" gutterBottom>
        How to Manage Projects Efficiently
      </Typography>

      {/* Subheading */}
      <Typography variant="h6" component="h3" gutterBottom>
        Introduction
      </Typography>
      <Typography variant="body1" paragraph>
        Managing projects efficiently requires the right tools, strategies, and team collaboration.
        In this article, we will explore essential tips for improving project management and
        achieving success.
      </Typography>

      {/* Another Subheading */}
      <Typography variant="h6" component="h3" gutterBottom>
        Key Project Management Strategies
      </Typography>
      <Typography variant="body1" paragraph>
        The following strategies are crucial for effective project management:
      </Typography>

      {/* Bullet Points */}
      <Box my={2}>
        <ol>
          <li>
            <ListItemText primary="Define Clear Project Goals" />
          </li>
          <li>
            <ListItemText primary="Set Realistic Deadlines" />
          </li>
          <li>
            <ListItemText primary="Establish Effective Communication" />
          </li>
          <li>
            <ListItemText primary="Use Project Management Tools" />
          </li>
        </ol>
      </Box>

      {/* New Section - Planning Your Project */}
      <Typography variant="h6" component="h3" gutterBottom>
        Planning Your Project
      </Typography>
      <Typography variant="body1" paragraph>
        Proper planning is the foundation of a successful project. Here are a few tips for building
        a solid project plan:
      </Typography>

      <Box my={2}>
        <ul>
          <li>
            <ListItemText primary="Break the Project into Phases" />
          </li>
          <li>
            <ListItemText primary="Allocate Resources Wisely" />
          </li>
          <li>
            <ListItemText primary="Identify Risks and Mitigation Strategies" />
          </li>
        </ul>
      </Box>

      {/* New Section - Time Management */}
      <Typography variant="h6" component="h3" gutterBottom>
        Time Management in Project Management
      </Typography>
      <Typography variant="body1" paragraph>
        Time management is one of the most challenging aspects of project management. Here are some
        ways to manage time more effectively:
      </Typography>

      <Box my={2}>
        <ol>
          <li>
            <ListItemText primary="Prioritize Tasks" />
          </li>
          <li>
            <ListItemText primary="Use Gantt Charts or Timelines" />
          </li>
          <li>
            <ListItemText primary="Set Milestones and Deadlines" />
          </li>
          <li>
            <ListItemText primary="Delegate Tasks Appropriately" />
          </li>
        </ol>
      </Box>

      {/* New Section - Handling Team Collaboration */}
      <Typography variant="h6" component="h3" gutterBottom>
        Handling Team Collaboration
      </Typography>
      <Typography variant="body1" paragraph>
        {`Effective collaboration can make or break a project. Here are some key
        strategies for improving team collaboration:`}
      </Typography>

      <Box my={2}>
        <ul>
          <li>
            <ListItemText primary="Promote Open Communication" />
          </li>
          <li>
            <ListItemText primary="Set Clear Roles and Responsibilities" />
          </li>
          <li>
            <ListItemText primary="Encourage Feedback and Brainstorming" />
          </li>
          <li>
            <ListItemText primary="Foster a Positive Team Culture" />
          </li>
        </ul>
      </Box>

      <Paper>
        <CardContent>
          {/* Conclusion */}
          <Typography variant="h6" component="h3" gutterBottom>
            Conclusion
          </Typography>
          <Typography variant="body1" paragraph>
            {`By implementing these strategies, you can ensure that your projects
            run smoothly and efficiently. The key is to stay organized and
            proactive throughout the project lifecycle.`}
          </Typography>

          {/* Final Note */}
          <Typography variant="body2" color="text.secondary">
            {
              "Remember, every project is unique, so it's important to adapt these strategies to fit your specific needs."
            }
          </Typography>
        </CardContent>
      </Paper>
    </Box>
  );
};

export default BlogContent;
