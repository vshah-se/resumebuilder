Resume & Applicant tracking

Project Walkthrough

The React application will be designed specifically to bypass ATS (Applicant Tracking System) filters while providing you with applicant tracking for all your applications

React UI should allow user to share linkedin profile or upload resume in pdf and docx. Backend should be able to pull profile from linkedin or extract data from pdf and docx. This should allow you to build knowledge based on user skills. Save this information in database. Gathering information should be done using insforge as api backend possibly using MCP servers. 

Second UI screen should be job description, where user can share url of job id or can share job description. Need to save this information in database and use AI to match the skills and requirement. Share the details on UI with user. 

Once user approves and confirm to continue with resume building. Share nice progress bar on UI and use AI to generate new resume. UI should be able to display generated resume in browser with capablity to add user profile picture. If user likes this information, allow user to download it. Once user downloads it update ATS to for future prupose.

I want fronted developed using reactjs and backed in python, if possible. Once craeted host is locally on docker container, I want two containers - frontend and backend. frontend should be able to connect with backend docker container. I want url to open it locally. 


Key Features

ATS Engine
The biggest challenge with standard resume builders is they use heavy DOM styling or canvas-based PDF generation which Applicant Tracking Systems cannot read mathematically.

We will build an ATS friendly resume for each job to make it ready for submission and tracking for the applicant

The resume should be saved as PDF or docx.