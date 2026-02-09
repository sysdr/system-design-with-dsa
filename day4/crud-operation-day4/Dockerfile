# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Create the database file outside the /app directory to persist it if needed,
# or ensure it's created during runtime. For this demo, it will be created in /app
# when the app starts.
# RUN python src/database.py

# Expose the port the app runs on
EXPOSE 8000

# Define environment variables
ENV DB_FILE=instance.db

# Run the uvicorn server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
