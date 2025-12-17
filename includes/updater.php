<?php
/**
 * GitHub Update Checker for Shopify Sidecart
 * 
 * @package Shopify Sidecart
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Shopify_Sidecart_Updater
 * Handles checking for updates from GitHub releases
 */
class Shopify_Sidecart_Updater {
    
    /**
     * GitHub repository owner
     *
     * @var string
     */
    private $owner = 'codebyamos';
    
    /**
     * GitHub repository name
     *
     * @var string
     */
    private $repo = 'shopify-sidecart';
    
    /**
     * Current plugin version
     *
     * @var string
     */
    private $current_version;
    
    /**
     * Plugin slug
     *
     * @var string
     */
    private $plugin_slug;
    
    /**
     * Plugin basename
     *
     * @var string
     */
    private $plugin_basename;
    
    /**
     * Constructor
     *
     * @param string $plugin_file Path to main plugin file
     * @param string $version Current plugin version
     */
    public function __construct($plugin_file, $version) {
        $this->current_version = $version;
        $this->plugin_basename = plugin_basename($plugin_file);
        $this->plugin_slug = dirname($this->plugin_basename);
        
        // Hook into WordPress update system
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_update'));
        add_filter('plugins_api', array($this, 'plugin_info'), 10, 3);
        add_filter('upgrader_post_install', array($this, 'post_install'), 10, 3);
    }
    
    /**
     * Check for updates on GitHub
     *
     * @param object $transient Update transient
     * @return object Modified transient
     */
    public function check_update($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }
        
        // Get latest release from GitHub
        $release = $this->get_latest_release();
        
        if ($release && version_compare($this->current_version, $release['version'], '<')) {
            $plugin_data = array(
                'slug' => $this->plugin_slug,
                'plugin' => $this->plugin_basename,
                'new_version' => $release['version'],
                'url' => $release['url'],
                'package' => $release['download_url'],
                'requires' => '5.0',
                'requires_php' => '7.4',
                'tested' => '6.5',
            );
            
            $transient->response[$this->plugin_basename] = (object) $plugin_data;
        }
        
        return $transient;
    }
    
    /**
     * Get plugin information for update details
     *
     * @param false|object|array $result The result object or array
     * @param string $action The type of information being requested
     * @param object $args Plugin API arguments
     * @return object Plugin information
     */
    public function plugin_info($result, $action, $args) {
        if ($action !== 'plugin_information' || $args->slug !== $this->plugin_slug) {
            return $result;
        }
        
        $release = $this->get_latest_release();
        
        if (!$release) {
            return $result;
        }
        
        $info = new stdClass();
        $info->name = 'Shopify Sidecart';
        $info->slug = $this->plugin_slug;
        $info->version = $release['version'];
        $info->author = 'The Brandsmen';
        $info->author_profile = 'https://thebrandsmen.com/';
        $info->homepage = $release['url'];
        $info->requires = '5.0';
        $info->tested = '6.5';
        $info->requires_php = '7.4';
        $info->download_link = $release['download_url'];
        $info->last_updated = $release['published_at'];
        $info->sections = array(
            'description' => 'A custom Shopify sidecart plugin for WordPress that integrates with Shopify\'s Storefront API to provide a seamless shopping cart experience.',
            'changelog' => $release['changelog'],
        );
        $info->banners = array(
            'low' => '',
            'high' => '',
        );
        
        return $info;
    }
    
    /**
     * Post-installation hook
     *
     * @param bool $response Installation response
     * @param array $hook_extra Extra hook arguments
     * @param array $result Installation result
     * @return bool Modified response
     */
    public function post_install($response, $hook_extra, $result) {
        global $wp_filesystem;
        
        $install_directory = plugin_dir_path(__FILE__);
        $wp_filesystem->move($result['destination'], $install_directory);
        $result['destination'] = $install_directory;
        
        if ($this->plugin_slug) {
            activate_plugin($this->plugin_basename);
        }
        
        return $response;
    }
    
    /**
     * Get latest release from GitHub API
     *
     * @return array|false Release data or false on failure
     */
    private function get_latest_release() {
        $transient_key = 'shopify_sidecart_latest_release';
        $release = get_transient($transient_key);
        
        if ($release !== false) {
            return $release;
        }
        
        $api_url = "https://api.github.com/repos/{$this->owner}/{$this->repo}/releases/latest";
        
        $response = wp_remote_get($api_url, array(
            'headers' => array(
                'Accept' => 'application/vnd.github.v3+json',
                'User-Agent' => 'Shopify-Sidecart-WordPress-Plugin',
            ),
            'timeout' => 10,
        ));
        
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            // Fallback: return false and cache for shorter time
            set_transient($transient_key, false, HOUR_IN_SECONDS);
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (empty($data) || !isset($data['tag_name'])) {
            set_transient($transient_key, false, HOUR_IN_SECONDS);
            return false;
        }
        
        // Extract version from tag (remove 'v' prefix if present)
        $version = ltrim($data['tag_name'], 'v');
        
        // Find zipball download URL
        $download_url = '';
        if (isset($data['zipball_url'])) {
            $download_url = $data['zipball_url'];
        } elseif (isset($data['assets'][0]['browser_download_url'])) {
            $download_url = $data['assets'][0]['browser_download_url'];
        }
        
        $release = array(
            'version' => $version,
            'url' => $data['html_url'],
            'download_url' => $download_url,
            'published_at' => $data['published_at'],
            'changelog' => $data['body'] ?: 'No changelog provided.',
        );
        
        // Cache for 12 hours
        set_transient($transient_key, $release, 12 * HOUR_IN_SECONDS);
        
        return $release;
    }
    
    /**
     * Set GitHub repository details
     *
     * @param string $owner Repository owner
     * @param string $repo Repository name
     */
    public function set_repository($owner, $repo) {
        $this->owner = $owner;
        $this->repo = $repo;
    }
}