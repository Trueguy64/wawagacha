{ config, lib, pkgs }: let
	cfg = config.services.wawagacha-server;
in {
	options.services = {
		wawagacha-server = {
			enable = lib.mkEnableOption "wawagacha-server";
			package = lib.mkPackageOption pkgs "wawagacha-server" { };
		};
	};

	config = lib.mkIf cfg.enable {

	};
}
