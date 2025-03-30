# app/__init__.py
from flask import Flask, render_template
from .config import Config
from .extensions import init_extensions
from app.utils.cache import init_cache  # Import the cache initializer


import os

# Create exports directory if it doesn't exist




def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    init_extensions(app)

    # Initialize cache
    init_cache(app)

    
    # Register blueprints
    from app.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Serve the Vue.js frontend
    @app.route('/')
    @app.route('/<path:path>')
    def index(path=None):
        return render_template('index.html')
    
    return app