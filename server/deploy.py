import subprocess
import sys

def run_commands():
    commands = [
        "npm run bot:deploy -w server",
        "npm run build -w server",
        "pm2 restart wawagacha-bot --update-env"
    ]

    for cmd in commands:
        print(f"🚀 Executing: {cmd}")
        try:
            # shell=True allows us to pass the command as a single string
            # check=True raises an exception if the command fails (non-zero exit code)
            subprocess.run(cmd, shell=True, check=True)
            print(f"✅ Success: {cmd}\n")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error executing command: {cmd}")
            print(f"Exit code: {e.returncode}")
            sys.exit(1) # Exit the script with an error code

    print("🎉 All commands executed successfully!")

if __name__ == "__main__":
    run_commands()
