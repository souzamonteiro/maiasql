#!/bin/bash

git pull
git pull --recurse-submodules
git submodule init
git submodule update --remote --recursive
