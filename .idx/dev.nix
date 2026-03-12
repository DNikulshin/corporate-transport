# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.docker-compose
    pkgs.openssl
    pkgs.openssl_3
  ];

  env = {};

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    previews = {
      enable = true;
      previews = {};
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      # Runs when the workspace is (re)started
      onStart = {
        # This hook sets up a complete Android SDK environment idempotently.
        setup-android-env = ''
          # Define a persistent home for the Android SDK
          export ANDROID_HOME="$HOME/Android/sdk"
          mkdir -p "$ANDROID_HOME"

          # Temporarily add the new sdkmanager to the path to bootstrap the environment
          
          # Run setup only if SDK components seem to be missing
          if [ ! -d "$ANDROID_HOME/platforms" ]; then
            echo "Downloading Android SDK components..."
            # Use sdkmanager to download required components. Adjust versions as needed.
            yes | "$SDKMANAGER_PATH/sdkmanager" --sdk_root="$ANDROID_HOME" "platform-tools" "build-tools;34.0.0" "platforms;android-34"
            echo "Finished downloading Android SDK components."
          fi

          # Ensure .bashrc is configured for future terminal sessions
          if ! grep -q "export ANDROID_HOME" ~/.bashrc; then
            echo "" >> ~/.bashrc
            echo "# Added by IDX to configure the Android environment" >> ~/.bashrc
            echo "export ANDROID_HOME=$HOME/Android/sdk" >> ~/.bashrc
            echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin' >> ~/.bashrc
            echo "Android environment variables added to ~/.bashrc"
          fi
          
          # Source .bashrc to apply variables to the current process
          source ~/.bashrc
        '';
      };
    };
  };

  services.docker.enable = true;
}
