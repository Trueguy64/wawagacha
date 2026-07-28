{
	description = "wawagacha";

	inputs = {
		nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
	};

	outputs = { self, nixpkgs }: let
		system = "x86_64-linux";
		pkgs = nixpkgs.legacyPackages.${system};
	in {
		packages.${system} = {
			wawagacha-server = pkgs.callPackage ./nix/packages/server.nix { };
			wawagacha-web = pkgs.callPackage ./nix/packages/web.nix { };
		};

		nixosModules.${system} = {
			wawagacha-server = pkgs.callPackage ./nix/modules/server.nix { };
			wawagacha-web = pkgs.callPackage ./nix/modules/web.nix { };
		};

		devShells.${system}.default = pkgs.mkShell {
			buildInputs = builtins.attrValues {
				inherit
					(pkgs)
					prisma-engines_6
					prisma
					;
			};

			# https://wiki.nixos.org/wiki/Prisma
			shellHook = ''
				export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"
				export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/schema-engine"
				export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/query-engine"
				export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines_6}/lib/libquery_engine.node"
				export PRISMA_FMT_BINARY="${pkgs.prisma-engines_6}/bin/prisma-fmt"
			'';
		};
	};
}
