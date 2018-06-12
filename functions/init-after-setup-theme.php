<?php
/* ------------------------------------------------------------------------- *
 *  Base functionality
/* ------------------------------------------------------------------------- */

// Content width
if ( !isset( $content_width ) ) { $content_width = 720; }


/*  Theme setup
/* ------------------------------------ */
if ( ! function_exists( 'hu_setup' ) ) {

  function hu_setup() {
     // Load theme languages
    load_theme_textdomain( HU_THEME_TEXT_DOM, get_stylesheet_directory().'/languages' );

    // Enable header image
    // the header image is stored as a theme mod option
    // get_theme_mod( 'header_image', get_theme_support( 'custom-header', 'default-image' ) );
    // Backward compat : if a header-image was previously set by the user, then it becomes the default image, otherwise we fall back on the asset's default.
    $_old_header_image_val = hu_get_option('header-image');
    $did_user_set_an_image = false != $_old_header_image_val && ! empty($_old_header_image_val);
    $headers = apply_filters( 'hu_default_header_img' , array(
            'default-header' => array(
              'url'           => '%s/assets/front/img/header/default-header-280.jpg',
              'thumbnail_url' => '%s/assets/front/img/header/default-header-280.jpg',
              'description'   => 'Coffee'
            ),
            'yosemite' => array(
              'url'           => '%s/assets/front/img/header/yosemite-280.jpg',
              'thumbnail_url' => '%s/assets/front/img/header/yosemite-280.jpg',
              'description'   => 'Yosemite'
            ),
            'bridge' => array(
              'url'           => '%s/assets/front/img/header/bridge-280.jpg',
              'thumbnail_url' => '%s/assets/front/img/header/bridge-280.jpg',
              'description'   => 'Golden Gate Bridge'
            ),
            'nyc' => array(
              'url'           => '%s/assets/front/img/header/nyc-280.jpg',
              'thumbnail_url' => '%s/assets/front/img/header/nyc-280.jpg',
              'description'   => 'New York City'
            ),
            'california' => array(
              'url'           => '%s/assets/front/img/header/california-280.jpg',
              'thumbnail_url' => '%s/assets/front/img/header/california-280.jpg',
              'description'   => 'California'
            )
        )
    );
    register_default_headers( $headers );

    add_theme_support( 'custom-header', array(
        'default-image' => $did_user_set_an_image ? hu_get_img_src_from_option('header-image') : sprintf( '%1$s/assets/front/img/header/default-header-280.jpg' , get_template_directory_uri() ),
        'width'     => 1380,
        'height'    => 280,
        'flex-width' => true,
        'flex-height' => true,
        'header-text'  => false
    ) );

    // Enable Custom Logo
    add_theme_support( 'custom-logo', array(
        'width'     => 250,
        'height'    => 100,
        'flex-width' => true,
        'flex-height' => true,
    ) );

    // Enable title tag
    add_theme_support( 'title-tag' );
    // Enable automatic feed links
    // => Adds RSS feed links to <head> for posts and comments.
    add_theme_support( 'automatic-feed-links' );
    // Enable featured image
    add_theme_support( 'post-thumbnails' );
    // Enable post format support
    add_theme_support( 'post-formats', array( 'audio', 'aside', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' ) );
    // Add theme support for selective refresh for widgets.
    // Only add if the link manager is not enabled
    // cf WP core ticket #39451
    if ( ! get_option( 'link_manager_enabled' ) ) {
      add_theme_support( 'customize-selective-refresh-widgets' );
    }

    // Thumbnail sizes
    add_image_size( 'thumb-small', 160, 160, true );
    add_image_size( 'thumb-standard', 320, 320, true );
    add_image_size( 'thumb-medium', 520, 245, true );
    add_image_size( 'thumb-large', 720, 340, true );
    add_image_size( 'thumb-xlarge', 980, 450, true );
    add_image_size( 'thumb-xxlarge', 1320, 500, true );

    // Custom menu areas
    register_nav_menus( array(
      'topbar' => __( 'Topbar', 'hueman' ),
      'mobile' => __( 'Mobile. You can set a specific menu for mobile devices. If not set, the theme will use the menu assigned to the Topbar, or the Header.', 'hueman' ),
      'header' => __( 'Header', 'hueman' ),
      'footer' => __( 'Footer', 'hueman' )
    ) );
  }

}
add_action( 'after_setup_theme', 'hu_setup' );

add_action( 'after_setup_theme', 'hu_fn_load_czr_base_fmk', 15 );
function hu_fn_load_czr_base_fmk() {
    // load the czr-base-fmk
    if ( ! isset( $GLOBALS['czr_base_fmk_namespace'] ) ) {
        require_once(  dirname( __FILE__ ) . '/czr-base-fmk/czr-base-fmk.php' );
        \hu_czr_fmk\CZR_Fmk_Base( array(
           'text_domain' => 'customizr',
           'base_url' => HU_BASE_URL . 'functions/czr-base-fmk',
           'version' => HUEMAN_VER
        ) );
    } else {
        //error_log('Warning => the czr_base_fmk should be loaded and instantiated by the theme.');
    }
}

add_action( 'after_setup_theme', 'hu_fn_load_social_links_module', 20 );
function hu_fn_load_social_links_module() {
    // load the social links module
    require_once( HU_BASE . 'functions/czr-modules/social-links/social_links_module.php' );
    hu_register_social_links_module(
        array(
            'setting_id' => 'hu_theme_options[social-links]',

            'base_url_path' => HU_BASE_URL . '/functions/czr-modules/social-links',
            'version' => HUEMAN_VER,

            'option_value' => hu_get_option( 'social-links' ), // for dynamic registration
            'setting' => array(
                'type' => 'option',
                'default'  => array(),
                'transport' => hu_is_partial_refreshed_on() ? 'postMessage' : 'refresh',
                'sanitize_callback' => 'hu_sanitize_callback__czr_social_module',
                'validate_callback' => 'hu_validate_callback__czr_social_module'
            ),

            'section' => array(
                'id' => 'social_links_sec',
                'title' => __( 'Social links', 'hueman' ),
                'panel' => 'hu-general-panel',
                'priority' => 30
            ),

            'control' => array(
                'priority' => 10,
                'label' => __( 'Create and organize your social links', 'hueman' ),
                'type'  => 'czr_module',
            )
        )
    );
}