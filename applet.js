const Applet = imports.ui.applet;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;


class CinnamonDNSChangerApplet extends Applet.TextIconApplet {


    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);


        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.settings = new Settings.AppletSettings(this, "dns-changer@nos486", instance_id);

        this.settings.bind("icon-name", "icon_name", this.on_settings_changed, null);
        this.settings.bind("server_list", "server_list", this.server_list_update);


        this.dnsSection = new PopupMenu.PopupMenuSection();

        this.menu.addMenuItem(this.dnsSection)
        // this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.on_settings_changed()
        this.server_list_update()

    }

    on_settings_changed() {

        let icon_file = Gio.File.new_for_path(this.icon_name);
        if (icon_file.query_exists(null)) {
            this.set_applet_icon_path(this.icon_name);
        } else {
            this.set_applet_icon_name(this.icon_name);
        }
    }

    on_slider_changed(slider, value) {
        this.scale_val = value;
    }

    on_applet_clicked(event) {
        this.server_list_update()
        this.menu.toggle();
    }

    on_applet_removed_from_panel() {
        this.settings.finalize();
    }

    server_list_update() {
        this.dnsSection.removeAll()

        for (let index in this.server_list) {
            let server = this.server_list[index]
            if (server.is_show) {
                let menuItem = new PopupMenu.PopupMenuItem(server.name)
                menuItem.activate = () => {
                    this.server_list_update()
                    this.set_dns(server.ip1,server.ip2)
                }
                this.dnsSection.addMenuItem(menuItem);
                if(this.check_dns(server.ip1,server.ip2)){
                    menuItem.setShowDot(true)
                }
            }
        }
    }

    set_dns(ip_1,ip_2){

        let homeDir = GLib.get_home_dir()
        let args = ['bash',`${homeDir}/.local/share/cinnamon/applets/dns-changer@nos486/dns.sh` ,ip_1,ip_2];

        try {
            let proc = Gio.Subprocess.new(
                ['pkexec'].concat(args),
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                    // Failure
                    if (!proc.get_successful())
                        throw new Error(stderr);

                } catch (e) {
                    global.log(e);
                }
            });
        } catch (e) {
            global.log(e);
        }
    }

    check_dns(ip_1,ip_2){
        try {
            let homeDir = GLib.get_home_dir()
            let [res, out, err, status] = GLib.spawn_command_line_sync(`grep -q "${ip_1}" /etc/resolv.conf`);
            return status === 0
        }catch (e) {
            global.log(e)
        }
    }

}

function main(metadata, orientation, panel_height, instance_id) {
    return new CinnamonDNSChangerApplet(orientation, panel_height, instance_id);
}

