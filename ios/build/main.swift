import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Configure WebView
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        // Create window
        let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 430, height: 932)
        let windowWidth: CGFloat = 430
        let windowHeight: CGFloat = 850
        let windowX = (screenFrame.width - windowWidth) / 2 + screenFrame.origin.x
        let windowY = (screenFrame.height - windowHeight) / 2 + screenFrame.origin.y
        
        window = NSWindow(
            contentRect: NSRect(x: windowX, y: windowY, width: windowWidth, height: windowHeight),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "FinNote"
        window.minSize = NSSize(width: 375, height: 667)
        window.backgroundColor = NSColor.black
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden

        // Create WebView
        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")
        window.contentView?.addSubview(webView)

        // Load local web content
        let resourcePath = Bundle.main.resourcePath!
        let webDir = resourcePath + "/web"
        let indexURL = URL(fileURLWithPath: webDir + "/index.html")
        let webDirURL = URL(fileURLWithPath: webDir)
        webView.loadFileURL(indexURL, allowingReadAccessTo: webDirURL)

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Start the app
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
