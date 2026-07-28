{ pkgs, stdenv, nodejs, fetchPnpmDeps, pnpmConfigHook, pnpm }:
stdenv.mkDerivation (finalAttrs: {
		pname = "wawagacha-server";
		version = "0.1.0";
		src = ../..;

		nativeBuildInputs = [ nodejs pnpm pnpmConfigHook pkgs.openssl ];

		pnpmDeps = fetchPnpmDeps {
			inherit (finalAttrs) pname version src;
			fetcherVersion = 4;
			hash = "sha256-hDfnonOp1wC8Qxz+bTrIO9IsKa2Cwm1faxqOV/e31M0=";
		};

		PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines_6}/bin/schema-engine";
		PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines_6}/bin/query-engine";
		PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines_6}/lib/libquery_engine.node";
		PRISMA_FMT_BINARY = "${pkgs.prisma-engines_6}/bin/prisma-fmt";
		PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1";
		PRISMA_CLI_QUERY_ENGINE_TYPE = "binary";

		buildPhase = ''
			runHook preBuild
			pnpm --filter server build
			runHook postBuild
    	'';

		installPhase = ''
			runHook preInstall
			mkdir -p $out/
			cp -r server/dist $out/
			runHook postInstall
		'';
	})
