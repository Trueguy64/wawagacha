{ config, lib, pkgs }: let
	cfg = config.services.wawagacha-web;
in {
	options.services = {
		wawagacha-web = {
			enable = lib.mkEnableOption "wawagacha-web";
			package = lib.mkPackageOption pkgs "wawagacha-web" { };
		};
	};

	config = lib.mkIf cfg.enable {

	};
}
